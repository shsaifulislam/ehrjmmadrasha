import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings_bn.dart';
import '../../core/network/api_client.dart';
import '../common/widgets/ehrj_logo_widget.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback? onLoginSuccess;
  final VoidCallback? onBrowsePublic;

  const LoginScreen({super.key, this.onLoginSuccess, this.onBrowsePublic});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _fillSampleCredentials(int index) {
    // Security: Passwords must never be embedded or pre-filled in production code.
    // The role tabs provide the respective role identifier, leaving password for explicit user input.
    if (index == 0) {
      _identifierController.text = 'teacher';
    } else if (index == 1) {
      _identifierController.text = 'guardian_ui_demo';
    } else {
      _identifierController.text = 'adminehrj';
    }
    _passwordController.clear();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final success = await auth.login(
      _identifierController.text.trim(),
      _passwordController.text,
    );

    if (success && mounted) {
      widget.onLoginSuccess?.call();
    }
  }

  void _showServerConfigDialog(BuildContext context) {
    final api = context.read<ApiClient>();
    final controller = TextEditingController(text: api.baseUrl);
    bool testing = false;
    String? testResult;
    bool testSuccess = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          return AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.dns_rounded, color: AppColors.primary),
                SizedBox(width: 8),
                Text('সার্ভার সংযোগ সেটিংস', style: TextStyle(fontSize: 16)),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'মোবাইল ফোন ও কম্পিউটারের মধ্যে এপিআই সংযোগ নির্ধারণ করুন:',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondaryLight,
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: controller,
                    decoration: const InputDecoration(
                      labelText: 'API Base URL',
                      hintText: 'http://192.168.0.240:3000',
                      prefixIcon: Icon(Icons.link_rounded),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'দ্রুত বাছাই করুন:',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: [
                      ActionChip(
                        label: const Text('Wi-Fi LAN (192.168.0.240)'),
                        onPressed: () => setDialogState(
                          () => controller.text = 'http://192.168.0.240:3000',
                        ),
                      ),
                      ActionChip(
                        label: const Text('Emulator (10.0.2.2)'),
                        onPressed: () => setDialogState(
                          () => controller.text = 'http://10.0.2.2:3000',
                        ),
                      ),
                      ActionChip(
                        label: const Text('Localhost (Web/PC)'),
                        onPressed: () => setDialogState(
                          () => controller.text = 'http://localhost:3000',
                        ),
                      ),
                    ],
                  ),
                  if (testResult != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: testSuccess
                            ? AppColors.present.withValues(alpha: 0.1)
                            : AppColors.absent.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            testSuccess
                                ? Icons.check_circle_rounded
                                : Icons.error_outline_rounded,
                            color: testSuccess
                                ? AppColors.present
                                : AppColors.absent,
                            size: 16,
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              testResult!,
                              style: TextStyle(
                                fontSize: 11,
                                color: testSuccess
                                    ? AppColors.present
                                    : AppColors.absent,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: testing
                    ? null
                    : () async {
                        setDialogState(() {
                          testing = true;
                          testResult = null;
                        });
                        try {
                          final targetUrl = controller.text.trim();
                          final dio = Dio(
                            BaseOptions(
                              baseUrl: targetUrl,
                              connectTimeout: const Duration(seconds: 5),
                              receiveTimeout: const Duration(seconds: 5),
                            ),
                          );
                          final res = await dio.get('/api/notices');
                          setDialogState(() {
                            testing = false;
                            testSuccess = res.statusCode == 200;
                            testResult =
                                'সংযোগ সফল! (স্ট্যাটাস: ${res.statusCode})';
                          });
                        } catch (e) {
                          setDialogState(() {
                            testing = false;
                            testSuccess = false;
                            testResult =
                                'সংযোগ ব্যর্থ: সার্ভার চালু আছে কি এবং একই ওয়াইফাইয়ে আছেন কি না তা নিশ্চিত করুন।';
                          });
                        }
                      },
                child: testing
                    ? const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('সংযোগ পরীক্ষা'),
              ),
              ElevatedButton(
                onPressed: () async {
                  final newUrl = controller.text.trim();
                  if (newUrl.isNotEmpty) {
                    await api.updateBaseUrl(newUrl);
                    if (context.mounted) {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            'সার্ভার ইউআরএল সফলভাবে সংরক্ষিত: $newUrl',
                          ),
                          backgroundColor: AppColors.primary,
                        ),
                      );
                      setState(() {});
                    }
                  }
                },
                child: const Text('সংরক্ষণ'),
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: AppColors.bgLight,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const EhrjLogoWidget(size: 80),
                  const SizedBox(height: 14),
                  const Text(
                    AppStringsBn.institutionName,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryDark,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    AppStringsBn.appTitle,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textMutedLight,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Role Tabs
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    padding: const EdgeInsets.all(3),
                    child: TabBar(
                      controller: _tabController,
                      onTap: _fillSampleCredentials,
                      labelColor: Colors.white,
                      unselectedLabelColor: AppColors.textSecondaryLight,
                      indicator: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      tabs: const [
                        Tab(text: 'উস্তাদ / শিক্ষক'),
                        Tab(text: 'অভিভাবক / ছাত্র'),
                        Tab(text: 'প্রশাসন'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Login Form Card
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            if (auth.errorMessage != null) ...[
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: AppColors.absent.withValues(
                                    alpha: 0.1,
                                  ),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: AppColors.absent.withValues(
                                      alpha: 0.3,
                                    ),
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(
                                      Icons.error_outline_rounded,
                                      color: AppColors.absent,
                                      size: 20,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        auth.errorMessage!,
                                        style: const TextStyle(
                                          color: AppColors.absent,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 16),
                            ],

                            // Identifier Field
                            TextFormField(
                              controller: _identifierController,
                              decoration: const InputDecoration(
                                labelText: 'ইউজারনেম / ইমেইল / মোবাইল',
                                prefixIcon: Icon(Icons.person_outline_rounded),
                              ),
                              validator: (v) => v == null || v.trim().isEmpty
                                  ? AppStringsBn.requiredField
                                  : null,
                            ),
                            const SizedBox(height: 16),

                            // Password Field
                            TextFormField(
                              controller: _passwordController,
                              obscureText: _obscurePassword,
                              decoration: InputDecoration(
                                labelText: 'পাসওয়ার্ড',
                                prefixIcon: const Icon(
                                  Icons.lock_outline_rounded,
                                ),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscurePassword
                                        ? Icons.visibility_off_outlined
                                        : Icons.visibility_outlined,
                                  ),
                                  onPressed: () => setState(
                                    () => _obscurePassword = !_obscurePassword,
                                  ),
                                ),
                              ),
                              validator: (v) => v == null || v.isEmpty
                                  ? AppStringsBn.requiredField
                                  : null,
                            ),
                            const SizedBox(height: 24),

                            // Login Button
                            ElevatedButton(
                              onPressed: auth.isLoading ? null : _handleLogin,
                              child: auth.isLoading
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                        color: Colors.white,
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : const Text(AppStringsBn.login),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Public Visitor Bypass Button
                  if (widget.onBrowsePublic != null)
                    TextButton.icon(
                      onPressed: widget.onBrowsePublic,
                      icon: const Icon(Icons.public_rounded, size: 18),
                      label: const Text(
                        'লগইন ব্যতীত পাবলিক ক্যাম্পাস ব্রাউজ করুন',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ),

                  const SizedBox(height: 10),

                  // Configurable Server URL Chip
                  InkWell(
                    onTap: () => _showServerConfigDialog(context),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.cardBorderLight),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.dns_rounded,
                            size: 14,
                            color: AppColors.textMutedLight,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'সার্ভার: ${context.read<ApiClient>().baseUrl}',
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textSecondaryLight,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(
                            Icons.edit_outlined,
                            size: 12,
                            color: AppColors.primary,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
