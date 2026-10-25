class UserModel {
  final String id;
  final String name;
  final String username;
  final String? email;
  final String role; // ADMIN, PRINCIPAL, TEACHER, STUDENT, GUARDIAN, ACCOUNTANT
  final String? phone;
  final String? photoUrl;

  UserModel({
    required this.id,
    required this.name,
    required this.username,
    this.email,
    required this.role,
    this.phone,
    this.photoUrl,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      username: json['username']?.toString() ?? '',
      email: json['email']?.toString(),
      role: json['role']?.toString().toUpperCase() ?? 'GUARDIAN',
      phone: json['phone']?.toString(),
      photoUrl: json['photoUrl']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'username': username,
      'email': email,
      'role': role,
      'phone': phone,
      'photoUrl': photoUrl,
    };
  }

  bool get isAdmin => role == 'ADMIN';
  bool get isPrincipal => role == 'PRINCIPAL';
  bool get isTeacher => role == 'TEACHER';
  bool get isGuardian => role == 'GUARDIAN';
  bool get isStudent => role == 'STUDENT';
  bool get isAccountant => role == 'ACCOUNTANT' || role == 'ADMIN';
}
