import 'package:flutter_test/flutter_test.dart';
import 'package:ehrj_flutter_app/core/constants/app_strings_bn.dart';
import 'package:ehrj_flutter_app/data/models/user_model.dart';

void main() {
  test('EHRJ Flutter Sanity Test', () {
    expect(AppStringsBn.institutionShort, 'EHRJ Madrasha');
    final user = UserModel(
      id: 'test_1',
      name: 'উস্তাদ',
      username: 'teacher',
      role: 'TEACHER',
    );
    expect(user.isTeacher, true);
  });
}
