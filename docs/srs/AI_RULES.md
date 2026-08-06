# MANDATORY AI AGENT DEVELOPMENT RULES

All AI Agents operating in this repository MUST strictly abide by the following 10 rules. Violation of these rules compromises the integrity of the Enterprise ERP.

1. **Repository Scan First:** কোনো নতুন Page তৈরির আগে Repository Scan করতে হবে (Pre-Scan Audit is mandatory).
2. **No Duplication:** কোনো Page duplicate করা যাবে না। 
3. **No Hardcoded Data:** Hardcoded Data ব্যবহার করা যাবে না।
4. **No Placeholders:** Placeholder ("Coming Soon", "TODO", "Mock Data") ব্যবহার করা যাবে না।
5. **Component Reusability:** প্রতিটি Page অবশ্যই Shared Component Library (`AppTable`, `AppForm`, etc.) ব্যবহার করবে।
6. **Strict Architecture Layering:** Controller থেকে সরাসরি Database Access করা যাবে না। Service Layer বাধ্যতামূলক।
7. **Holistic Feature Development:** প্রতিটি Feature RBAC, Audit Log, Notification এবং Validation বিবেচনা করে তৈরি করতে হবে।
8. **Definition of "Done":** প্রতিটি Module শেষ হলে Build, Test (Playwright) এবং Runtime Verification ছাড়া "Complete" বা "100%" বলা যাবে না।
9. **Module Sequential Integrity:** কোনো Module অসম্পূর্ণ রেখে পরবর্তী Module শুরু করা যাবে না। Status will remain "IN PROGRESS" until Volume 30 Master Checklist is ticked.
10. **SRS is Supreme:** Architecture, SRS এবং README-এর সাথে মিল না থাকলে কোড পরিবর্তন করতে হবে, SRS নয়।
