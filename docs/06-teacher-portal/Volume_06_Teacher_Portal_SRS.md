# Volume 06 – Teacher Portal Complete SRS (EHRJ-SRS-V06)

**Document Code:** EHRJ-SRS-V06  
**Module:** Teacher Portal  
**Applies To:** Teacher Web Portal (Responsive + Mobile Ready)  

---

## 1. Purpose & Workspace Architecture
Teacher Portal হলো শিক্ষকদের জন্য একটি পূর্ণাঙ্গ ডিজিটাল কর্মক্ষেত্র (Academic Workspace), যেখানে তারা ক্লাস, উপস্থিতি, পরীক্ষা, মার্কস এন্ট্রি, লেসন প্ল্যান, অ্যাসাইনমেন্ট, শিক্ষার্থী, অভিভাবক যোগাযোগ, নোটিশ ও ছুটির আবেদন পরিচালনা করবেন।

```text
Teacher ➔ Teacher Portal ➔ [ Dashboard, My Classes, My Subjects, Class Routine, Attendance, Assignment, Lesson Plan, Online Class, Exams, Marks Entry, Results, Student360, Guardian Communication, Notices, Messages, Leave, Documents, Calendar, Settings ]
```
- **Data Permission Policy:** Teacher Portal কখনো আলাদা Database ব্যবহার করবে না। সব তথ্য ERP Database থেকে Role-Based Permission অনুযায়ী Real-time API দ্বারা আসবে।

---

## 2. Authentication & Identification
- **Identifiers:** Username, Email, Mobile Number, Employee ID.
- **Authentication Standard:** JWT Access Token + Refresh Token, Device Session Management, Password Change/Reset, Device & Login History.

---

## 3. Teacher Dashboard & Workflows

```text
                           ┌─────────────────────────────────────────┐
                           │            Teacher Dashboard            │
                           └────────────────────┬────────────────────┘
                                                │
         ┌───────────────────┬──────────────────┼───────────────────┬───────────────────┐
         ▼                   ▼                  ▼                   ▼                   ▼
  [ Attendance ]      [ Marks Entry ]   [ Lesson Plan ]      [ Leave App ]     [ Student360 ]
   Bulk/Daily Entry    Draft/Lock Submit  Multi-stage Approval  Multi-stage Workflow Read-Only View
```

- **Dashboard KPI Widgets:** Today's Classes, Weekly Classes, Assigned Subjects, Attendance Pending, Marks Pending, Assignments Pending, Online Classes Today, Unread Messages, Leave Balance.
- **Charts & Visualizers:** Monthly Attendance Submission %, Marks Submission Status, Student Attendance Trend, Assignment Submission Trend.

---

## 4. Sub-System Specifications & Workflow Engines

1. **Class & Subject Management:** Assigned Classes, Sections, Shifts, Session, Student Rosters, Timetable, Lesson Planning, Course Resources.
2. **Attendance Capture Engine:** Daily/Bulk attendance, Late entry, Leave marking, Correction request, Save Draft ➔ Final Submit ➔ Lock, Print & Export options.
3. **Lesson Plan Approval Workflow:**
   `Teacher` ➔ `Academic Coordinator Review` ➔ `Principal Approval` ➔ `Publish`
4. **Assignment & Online Classes:** Homework creation, Student submissions, Grading/Feedback, Zoom / Google Meet live class links, Auto-attendance sync.
5. **Marks Entry & Lock Protection:** Subject-wise marks grid, Bulk Entry, Excel Upload, Draft saving, Final Submit. **Submitted Marks are locked** and can only be unlocked by authorized Academic Admins.
6. **Multi-stage Leave Workflow:**
   `Teacher Application` ➔ `Head Teacher` ➔ `Principal` ➔ `HR Approval`
7. **Student360 Access:** Permitted RBAC view of Personal Info, Guardian, Attendance, Results, Assignments, Behaviour, Medical Alerts, Communication History, Timeline.

---

## 5. REST API Integration Contracts (25 Endpoints)
- `GET /api/v1/teacher/dashboard`
- `GET /api/v1/teacher/profile`
- `PUT /api/v1/teacher/profile`
- `GET /api/v1/teacher/classes`
- `GET /api/v1/teacher/subjects`
- `GET /api/v1/teacher/routine`
- `GET /api/v1/teacher/attendance`
- `POST /api/v1/teacher/attendance`
- `PUT /api/v1/teacher/attendance`
- `GET /api/v1/teacher/lesson-plans`
- `POST /api/v1/teacher/lesson-plans`
- `GET /api/v1/teacher/assignments`
- `POST /api/v1/teacher/assignments`
- `GET /api/v1/teacher/exams`
- `GET /api/v1/teacher/results`
- `POST /api/v1/teacher/marks`
- `GET /api/v1/teacher/student360/:id`
- `GET /api/v1/teacher/messages`
- `POST /api/v1/teacher/messages`
- `GET /api/v1/teacher/notices`
- `GET /api/v1/teacher/calendar`
- `GET /api/v1/teacher/reports`
- `GET /api/v1/teacher/activity`
- `POST /api/v1/teacher/leave`
- `GET /api/v1/teacher/documents`

---

## 6. Master Database Entities Mapped (28 Entities)
`Teacher`, `Staff`, `User`, `Role`, `Permission`, `AcademicSession`, `Class`, `Section`, `Subject`, `Routine`, `Attendance`, `Assignment`, `AssignmentSubmission`, `LessonPlan`, `Exam`, `Result`, `Student`, `Guardian`, `Student360`, `Notice`, `Message`, `Leave`, `CalendarEvent`, `ActivityLog`, `AuditLog`, `Notification`, `OnlineClass`

---

## 7. Verification & 14-Point Completion Condition
Teacher Portal বাস্তবায়ন সম্পূর্ণ বলা যাবে যখন:
- [ ] নির্ধারিত সমস্ত পেজ এবং রুট সফলভাবে তৈরি হবে।
- [ ] Role-Based Permissions (RBAC) সম্পূর্ণ কার্যকর হবে।
- [ ] Attendance Capture & Lock ফ্লো কাজ করবে।
- [ ] Marks Entry বাস্তব ডাটাবেসে সংরক্ষিত ও লকড হবে।
- [ ] Assignment & Submission Workflow সম্পূর্ণ হবে।
- [ ] Online Class Integration কাজ করবে।
- [ ] Student360 RBAC Integration থাকবে।
- [ ] কোনো Placeholder বা Mock Data অবশিষ্ট থাকবে না।
- [ ] TypeScript Build (`npm run build`) সফল হবে।
- [ ] Clean Production Build পাস করবে।
- [ ] Playwright E2E Test Suite সম্পূর্ণ পাস করবে।
- [ ] Runtime Verification সম্পন্ন হবে।
- [ ] Physical Screenshot Evidence সংরক্ষিত থাকবে।
- [ ] Physical Screen Recording Evidence সংরক্ষিত থাকবে।
