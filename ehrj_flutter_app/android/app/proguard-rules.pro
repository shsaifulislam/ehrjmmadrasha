# Flutter and embedding classes
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.embedding.** { *; }
-keep class io.flutter.plugins.** { *; }

# SharedPreferences plugin and pigeon communication classes
-keep class io.flutter.plugins.sharedpreferences.** { *; }
-keep class dev.flutter.pigeon.** { *; }
-keep class dev.flutter.pigeon.shared_preferences_android.** { *; }
-dontwarn io.flutter.plugins.sharedpreferences.**
-dontwarn dev.flutter.pigeon.**

# Play Store / Deferred components suppressions
-dontwarn com.google.android.play.core.**

# Kotlin stdlib, runtime, and coroutines keep rules
-keep class kotlin.** { *; }
-keep interface kotlin.** { *; }
-keep class kotlinx.** { *; }
-keep interface kotlinx.** { *; }
-dontwarn kotlin.**
-dontwarn kotlinx.**
