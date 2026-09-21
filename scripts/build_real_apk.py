#!/usr/bin/env python3
"""
Hanouti 40 — Official Native Android APK Builder
Uses genuine Android SDK tools: aapt, ecj (Java compiler), dx (Dalvik bytecode compiler),
zipalign, and apksigner to build a genuine, native, installable Android APK.
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

def prepare_android_project():
    print("==================================================")
    print("PREPARING REAL ANDROID PROJECT STRUCTURE")
    print("==================================================")
    
    project_dir = Path("build/android-real")
    if project_dir.exists():
        shutil.rmtree(project_dir)
    project_dir.mkdir(parents=True, exist_ok=True)
    
    src_dir = project_dir / "src" / "com" / "hanouti40" / "app"
    src_dir.mkdir(parents=True, exist_ok=True)
    
    res_dir = project_dir / "res"
    (res_dir / "values").mkdir(parents=True, exist_ok=True)
    (res_dir / "drawable").mkdir(parents=True, exist_ok=True)
    
    bin_dir = project_dir / "bin"
    bin_dir.mkdir(parents=True, exist_ok=True)
    (bin_dir / "classes").mkdir(parents=True, exist_ok=True)
    
    assets_dir = project_dir / "assets"
    assets_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Copy web application into assets
    shutil.copytree("dist", assets_dir / "www")
    print("Copied web application into assets/www")
    
    # 2. Copy icons for all densities
    src_icon = Path("Hanouti40/assets/app_icon.png")
    if not src_icon.exists():
        src_icon = Path("public/icon.png")
    
    densities = {
        "mipmap-mdpi": "48x48",
        "mipmap-hdpi": "72x72",
        "mipmap-xhdpi": "96x96",
        "mipmap-xxhdpi": "144x144",
        "mipmap-xxxhdpi": "192x192",
        "drawable": "144x144"
    }
    
    for folder, dim in densities.items():
        folder_path = res_dir / folder
        folder_path.mkdir(parents=True, exist_ok=True)
        out_ico = folder_path / "ic_launcher.png"
        try:
            subprocess.run(["convert", str(src_icon), "-resize", dim, str(out_ico)], check=True)
        except Exception:
            shutil.copy2(src_icon, out_ico)
        shutil.copy2(out_ico, folder_path / "icon.png")
    print("Generated Android application icons for all mipmap densities")
    
    # 3. Write strings.xml and styles.xml
    strings_xml = """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Hanouti 40</string>
</resources>
"""
    (res_dir / "values" / "strings.xml").write_text(strings_xml)
    
    styles_xml = """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="@android:style/Theme.NoTitleBar.Fullscreen">
        <item name="android:windowBackground">@null</item>
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowFullscreen">true</item>
    </style>
</resources>
"""
    (res_dir / "values" / "styles.xml").write_text(styles_xml)
    
    # 4. Write AndroidManifest.xml
    manifest_xml = """<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.hanouti40.app"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-sdk
        android:minSdkVersion="21"
        android:targetSdkVersion="33" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

    <application
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:hardwareAccelerated="true"
        android:theme="@style/AppTheme"
        android:allowBackup="true"
        android:supportsRtl="true">

        <activity
            android:name="com.hanouti40.app.MainActivity"
            android:label="@string/app_name"
            android:exported="true"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
"""
    (project_dir / "AndroidManifest.xml").write_text(manifest_xml)
    
    # 5. Write MainActivity.java with production WebView client & Chrome client
    main_activity_java = """package com.hanouti40.app;

import android.app.Activity;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.PermissionRequest;
import android.os.Build;

public class MainActivity extends Activity {
    private WebView mWebView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                             WindowManager.LayoutParams.FLAG_FULLSCREEN);

        mWebView = new WebView(this);
        setContentView(mWebView);

        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            settings.setAllowFileAccessFromFileURLs(true);
            settings.setAllowUniversalAccessFromFileURLs(true);
        }

        mWebView.setWebViewClient(new WebViewClient());
        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    request.grant(request.getResources());
                }
            }
        });

        mWebView.loadUrl("file:///android_asset/www/index.html");
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && mWebView != null && mWebView.canGoBack()) {
            mWebView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
"""
    (src_dir / "MainActivity.java").write_text(main_activity_java)
    print("Generated MainActivity.java (Native POS WebView Controller)")
    return project_dir

def build_apk(project_dir):
    print("\n==================================================")
    print("COMPILING REAL NATIVE ANDROID APK")
    print("==================================================")
    
    android_jar = Path("/usr/lib/android-sdk/platforms/android-23/android.jar")
    if not android_jar.exists():
        raise FileNotFoundError(f"Missing {android_jar}")
        
    # Step 1: Generate R.java with aapt
    print("[1/6] Running aapt to generate R.java and package resources...")
    cmd_aapt_r = [
        "aapt", "package", "-m",
        "-J", str(project_dir / "src"),
        "-M", str(project_dir / "AndroidManifest.xml"),
        "-S", str(project_dir / "res"),
        "-I", str(android_jar)
    ]
    subprocess.run(cmd_aapt_r, check=True)
    print("  ✓ R.java generated successfully")
    
    # Step 2: Compile Java sources with ecj
    print("[2/6] Compiling Java source files with ecj...")
    java_files = list((project_dir / "src").rglob("*.java"))
    cmd_ecj = [
        "ecj",
        "-proc:none",
        "-1.7",
        "-cp", str(android_jar),
        "-d", str(project_dir / "bin" / "classes"),
    ] + [str(f) for f in java_files]
    subprocess.run(cmd_ecj, check=True)
    print("  ✓ Java bytecode compiled (.class files)")
    
    # Step 3: Convert .class files to Dalvik classes.dex with dx
    print("[3/6] Compiling JVM bytecode to Dalvik executable (classes.dex) with dx...")
    cmd_dx = [
        "dx",
        "--dex",
        f"--output={project_dir}/bin/classes.dex",
        f"{project_dir}/bin/classes"
    ]
    subprocess.run(cmd_dx, check=True)
    dex_size = (project_dir / "bin" / "classes.dex").stat().st_size
    print(f"  ✓ Real classes.dex generated ({dex_size:,} bytes)")
    
    # Step 4: Package resources and assets into unaligned APK with aapt
    print("[4/6] Packaging raw APK with aapt...")
    raw_apk = project_dir / "bin" / "app-unaligned.apk"
    cmd_aapt_pack = [
        "aapt", "package", "-f",
        "-M", str(project_dir / "AndroidManifest.xml"),
        "-S", str(project_dir / "res"),
        "-A", str(project_dir / "assets"),
        "-I", str(android_jar),
        "-F", str(raw_apk)
    ]
    subprocess.run(cmd_aapt_pack, check=True)
    
    # Add classes.dex into the APK
    shutil.copy2(project_dir / "bin" / "classes.dex", project_dir / "classes.dex")
    subprocess.run(["aapt", "add", "bin/app-unaligned.apk", "classes.dex"], cwd=project_dir, check=True)
    print(f"  ✓ Added classes.dex into {raw_apk.name}")
    
    # Step 5: ZipAlign APK
    print("[5/6] 4-byte zipalign optimization...")
    aligned_apk = project_dir / "bin" / "app-aligned.apk"
    cmd_zipalign = ["zipalign", "-f", "-v", "4", str(raw_apk), str(aligned_apk)]
    subprocess.run(cmd_zipalign, capture_output=True, check=True)
    print("  ✓ ZipAlign completed")
    
    # Step 6: Sign with apksigner
    print("[6/6] Cryptographic signing with apksigner (v1, v2, v3)...")
    keystore_path = project_dir / "hanouti40-release.keystore"
    cmd_genkey = [
        "keytool", "-genkeypair", "-v",
        "-keystore", str(keystore_path),
        "-alias", "hanouti40",
        "-keyalg", "RSA",
        "-keysize", "2048",
        "-validity", "10000",
        "-storepass", "hanouti40pass",
        "-keypass", "hanouti40pass",
        "-dname", "CN=Hanouti 40, OU=Mobile, O=Hanouti Soft, L=Algiers, ST=Algiers, C=DZ"
    ]
    subprocess.run(cmd_genkey, capture_output=True, check=True)
    
    out_release = Path("Hanouti40-Releases/Android/Hanouti40-release.apk")
    out_release.parent.mkdir(parents=True, exist_ok=True)
    
    cmd_sign = [
        "apksigner", "sign",
        "--ks", str(keystore_path),
        "--ks-key-alias", "hanouti40",
        "--ks-pass", "pass:hanouti40pass",
        "--key-pass", "pass:hanouti40pass",
        "--out", str(out_release),
        str(aligned_apk)
    ]
    subprocess.run(cmd_sign, check=True)
    
    # Verify with apksigner
    cmd_verify = ["apksigner", "verify", "--verbose", str(out_release)]
    res = subprocess.run(cmd_verify, capture_output=True, text=True, check=True)
    print("apksigner verification output:\n" + res.stdout.strip())
    
    size = out_release.stat().st_size
    print(f"\n🎉 REAL NATIVE ANDROID APK CREATED: {out_release} ({size:,} bytes, {size / (1024*1024):.2f} MB)")
    print("==================================================\n")

if __name__ == '__main__':
    pdir = prepare_android_project()
    build_apk(pdir)
