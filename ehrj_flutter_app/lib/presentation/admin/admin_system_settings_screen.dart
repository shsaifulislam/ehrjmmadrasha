import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings_bn.dart';
import '../../core/network/api_client.dart';
import '../../data/repositories/admin_repository.dart';
import '../common/widgets/ehrj_card.dart';
import '../common/widgets/ehrj_logo_widget.dart';

class AdminSystemSettingsScreen extends StatefulWidget {
  const AdminSystemSettingsScreen({super.key});

  @override
  State<AdminSystemSettingsScreen> createState() =>
      _AdminSystemSettingsScreenState();
}

class _AdminSystemSettingsScreenState extends State<AdminSystemSettingsScreen> {
  Map<String, dynamic>? _settings;
  bool _isLoading = true;
  final TextEditingController _serverUrlCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadSettings();
    final api = context.read<ApiClient>();
    _serverUrlCtrl.text = api.baseUrl;
  }

  @override
  void dispose() {
    _serverUrlCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadSettings() async {
    setState(() => _isLoading = true);
    final repo = context.read<AdminRepository>();
    final data = await repo.getSystemSettings();
    if (mounted) {
      setState(() {
        _settings = data;
        _isLoading = false;
      });
    }
  }

  Future<void> _updateServerUrl() async {
    final newUrl = _serverUrlCtrl.text.trim();
    if (newUrl.isEmpty) return;

    final api = context.read<ApiClient>();
    await api.updateBaseUrl(newUrl);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('সার্ভার URL হালনাগাদ করা হয়েছে: $newUrl'),
          backgroundColor: const Color(0xFF0D5C3A),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final site = _settings?['site'] as Map<String, dynamic>? ?? {};
    final system = _settings?['system'] as Map<String, dynamic>? ?? {};

    return Scaffold(
      backgroundColor: AppColors.bgLight,
      appBar: AppBar(
        title: const Text('সিস্টেম ও প্রতিষ্ঠান সেটিংস'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Institutional Identity Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.cardBorderLight),
                  ),
                  child: Row(
                    children: [
                      const EhrjLogoWidget(size: 54),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              site['nameBn'] ?? AppStringsBn.institutionName,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              site['nameEn'] ?? 'Eliotganj Hazi Rohmatollah Jamiria Madrasha',
                              style: const TextStyle(fontSize: 11, color: AppColors.textSecondaryLight),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'মুহতামিম: ${site['principal'] ?? 'মাওলানা মহা. আবুল কালাম সরকার'}',
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF0D5C3A)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Active Session & System Status
                EhrjCard(
                  title: 'একাডেমিক সেশন ও সিস্টেম স্বাস্থ্য',
                  icon: Icons.dns_rounded,
                  child: Column(
                    children: [
                      _buildInfoRow('সক্রিয় সেশন:', system['currentSession'] ?? '২০২৬ শিক্ষাবর্ষ'),
                      _buildInfoRow('সার্ভার স্ট্যাটাস:', 'অনলাইন (স্বাভাবিক)', valueColor: const Color(0xFF10B981)),
                      _buildInfoRow('ডাটাবেজ ইঞ্জিন:', system['databaseEngine'] ?? 'PostgreSQL / Prisma'),
                      _buildInfoRow('সর্বশেষ ব্যাকআপ:', system['lastBackupDate'] ?? '১৮ অক্টোবর ২০২৬'),
                      _buildInfoRow('অফিস ফোন:', site['primaryPhone'] ?? AppStringsBn.primaryPhone),
                      _buildInfoRow('অফিসিয়াল ইমেইল:', site['email'] ?? AppStringsBn.officialEmail),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Backend API Server Configuration
                EhrjCard(
                  title: 'ERP API সার্ভার সংযোগ কনফিগারেশন',
                  icon: Icons.router_rounded,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'অ্যাপটি বর্তমানে নিচের ERP সার্ভার এন্ডপয়েন্টের সাথে যুক্ত:',
                        style: TextStyle(fontSize: 12, color: AppColors.textSecondaryLight),
                      ),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _serverUrlCtrl,
                        decoration: const InputDecoration(
                          labelText: 'ERP Base URL',
                          hintText: 'https://www.ehrjmadrasha.com',
                          prefixIcon: Icon(Icons.link_rounded),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          ActionChip(
                            label: const Text('Localhost (ল্যাপটপ)', style: TextStyle(fontSize: 11)),
                            onPressed: () {
                              _serverUrlCtrl.text = 'http://localhost:3000';
                              _updateServerUrl();
                            },
                          ),
                          ActionChip(
                            label: const Text('Local LAN (192.168.0.240)', style: TextStyle(fontSize: 11)),
                            onPressed: () {
                              _serverUrlCtrl.text = 'http://192.168.0.240:3000';
                              _updateServerUrl();
                            },
                          ),
                          ActionChip(
                            label: const Text('লাইভ প্রোডাকশন ক্লাউড', style: TextStyle(fontSize: 11)),
                            onPressed: () {
                              _serverUrlCtrl.text = 'https://www.ehrjmadrasha.com';
                              _updateServerUrl();
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _updateServerUrl,
                          icon: const Icon(Icons.save_rounded, size: 18),
                          label: const Text('সার্ভার সংযোগ সংরক্ষণ করুন'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0D5C3A),
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
    );
  }

  Widget _buildInfoRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textMutedLight)),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: valueColor ?? AppColors.textPrimaryLight,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
