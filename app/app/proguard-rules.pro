# ProGuard Rules for Kids Vatika HRMS
-optimizationpasses 5
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-dontpreverify

# Retain Jetpack Compose and UI
-keep class androidx.compose.** { *; }
-keep class com.kidsvatika.hrms.ui.** { *; }

# Retain SQLCipher and Room
-keep class net.zetetic.database.sqlcipher.** { *; }
-keep class androidx.room.** { *; }
-keep class com.kidsvatika.hrms.data.local.** { *; }

# Retain Retrofit and Networking
-keep class retrofit2.** { *; }
-keep class okhttp3.** { *; }
-keep class com.kidsvatika.hrms.data.model.** { *; }

# Retain Google ML Kit
-keep class com.google.mlkit.** { *; }

# Strip Logs
-assumenosideeffects class android.util.Log {
    public static *** v(...);
    public static *** d(...);
    public static *** i(...);
}
