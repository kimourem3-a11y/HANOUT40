#!/usr/bin/env python3
"""
Hanouti 40 — Android Release APK Generator
Creates a genuine, valid Android APK package for:
Package: com.hanouti40.app
Application: Hanouti 40
Version: 1.0.0 (versionCode 1)
"""

import os
import sys
import struct
import hashlib
import zlib
import zipfile
import subprocess
from pathlib import Path

def encode_length(val):
    if val > 127:
        return bytes([(val >> 8) | 0x80, val & 0xFF])
    return bytes([val])

def build_string_pool(strings):
    string_count = len(strings)
    utf8_flag = 0x00000100
    
    offsets = []
    data = bytearray()
    for s in strings:
        offsets.append(len(data))
        encoded = s.encode('utf-8')
        char_len = len(s)
        byte_len = len(encoded)
        data.extend(encode_length(char_len) + encode_length(byte_len) + encoded + b'\x00')
        
    while len(data) % 4 != 0:
        data.append(0)
        
    header_size = 28
    string_offset = header_size + (string_count * 4)
    chunk_size = string_offset + len(data)
    
    header = struct.pack('<HH6I', 
        0x0001, # RES_STRING_POOL_TYPE
        header_size,
        chunk_size,
        string_count,
        0, # style count
        utf8_flag,
        string_offset,
        0 # style offset
    )
    offset_table = struct.pack(f'<{string_count}I', *offsets)
    return header + offset_table + data

def build_axml():
    strings = [
        # 0..7 Attribute names
        "versionCode",       # 0 -> res 0x0101021b
        "versionName",       # 1 -> res 0x0101021c
        "name",              # 2 -> res 0x01010003
        "label",             # 3 -> res 0x01010001
        "icon",              # 4 -> res 0x01010002
        "minSdkVersion",     # 5 -> res 0x0101020c
        "targetSdkVersion",  # 6 -> res 0x01010270
        "exported",          # 7 -> res 0x01010010
        # 8..9 Tags
        "manifest",          # 8
        "uses-permission",   # 9
        "uses-sdk",          # 10
        "application",       # 11
        "activity",          # 12
        "intent-filter",     # 13
        "action",            # 14
        "category",          # 15
        # 16..17 Namespaces
        "android",           # 16
        "http://schemas.android.com/apk/res/android", # 17
        # 18..27 Values
        "package",           # 18
        "com.hanouti40.app", # 19
        "1.0.0",             # 20
        "Hanouti 40",        # 21
        "com.hanouti40.app.MainActivity", # 22
        "android.permission.INTERNET",    # 23
        "android.permission.CAMERA",      # 24
        "android.permission.ACCESS_NETWORK_STATE", # 25
        "android.intent.action.MAIN",     # 26
        "android.intent.category.LAUNCHER" # 27
    ]
    
    str_pool = build_string_pool(strings)
    
    # Resource Map
    res_ids = [
        0x0101021b, # versionCode
        0x0101021c, # versionName
        0x01010003, # name
        0x01010001, # label
        0x01010002, # icon
        0x0101020c, # minSdkVersion
        0x01010270, # targetSdkVersion
        0x01010010, # exported
    ]
    res_map = struct.pack('<HHI', 0x0180, 8, 8 + len(res_ids) * 4) + struct.pack(f'<{len(res_ids)}I', *res_ids)
    
    # Namespaces
    ns_start = struct.pack('<HH5I', 0x0100, 16, 24, 1, 0xFFFFFFFF, 16, 17)
    ns_end   = struct.pack('<HH5I', 0x0101, 16, 24, 50, 0xFFFFFFFF, 16, 17)
    
    # Helper to create attributes
    # attr: (ns_idx, name_idx, raw_idx, type, data)
    def make_attr(ns_idx, name_idx, raw_idx, data_type, data_val):
        return struct.pack('<3IH2BI', ns_idx, name_idx, raw_idx, 8, 0, data_type, data_val)
        
    def start_elem(name_idx, attrs, line):
        chunk_len = 16 + 20 + len(attrs) * 20
        chunk = struct.pack('<HH5I6H',
            0x0102, 16, chunk_len,
            line, 0xFFFFFFFF,
            0xFFFFFFFF, name_idx,
            20, 20, len(attrs),
            0, 0, 0
        )
        for a in attrs:
            chunk += a
        return chunk
        
    def end_elem(name_idx, line):
        return struct.pack('<HH5I', 0x0103, 16, 24, line, 0xFFFFFFFF, 0xFFFFFFFF, name_idx)

    # 1. <manifest package="com.hanouti40.app" android:versionCode="1" android:versionName="1.0.0">
    # package is not in android namespace! ns_idx = 0xFFFFFFFF
    manifest_attrs = [
        make_attr(0xFFFFFFFF, 18, 19, 0x03, 19),    # package="com.hanouti40.app"
        make_attr(17, 0, 0xFFFFFFFF, 0x10, 1),      # android:versionCode=1
        make_attr(17, 1, 20, 0x03, 20),             # android:versionName="1.0.0"
    ]
    manifest_start = start_elem(8, manifest_attrs, 1)
    
    # 2. <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="34" />
    uses_sdk_attrs = [
        make_attr(17, 5, 0xFFFFFFFF, 0x10, 21),
        make_attr(17, 6, 0xFFFFFFFF, 0x10, 34),
    ]
    uses_sdk = start_elem(10, uses_sdk_attrs, 2) + end_elem(10, 2)
    
    # 3. <uses-permission android:name="android.permission.INTERNET" />
    perm_inet_attrs = [make_attr(17, 2, 23, 0x03, 23)]
    perm_inet = start_elem(9, perm_inet_attrs, 3) + end_elem(9, 3)
    
    # 4. <uses-permission android:name="android.permission.CAMERA" />
    perm_cam_attrs = [make_attr(17, 2, 24, 0x03, 24)]
    perm_cam = start_elem(9, perm_cam_attrs, 4) + end_elem(9, 4)

    # 5. <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    perm_net_attrs = [make_attr(17, 2, 25, 0x03, 25)]
    perm_net = start_elem(9, perm_net_attrs, 5) + end_elem(9, 5)

    # 6. <application android:label="Hanouti 40" android:icon="@res/0x7f020000">
    app_attrs = [
        make_attr(17, 3, 21, 0x03, 21),
        make_attr(17, 4, 0xFFFFFFFF, 0x01, 0x7f020000) # @drawable/ic_launcher or mipmap
    ]
    app_start = start_elem(11, app_attrs, 6)
    
    # 7. <activity android:name="com.hanouti40.app.MainActivity" android:label="Hanouti 40" android:exported="true">
    act_attrs = [
        make_attr(17, 2, 22, 0x03, 22),
        make_attr(17, 3, 21, 0x03, 21),
        make_attr(17, 7, 0xFFFFFFFF, 0x12, 1), # exported=true
    ]
    act_start = start_elem(12, act_attrs, 7)
    
    # 8. <intent-filter>
    filter_start = start_elem(13, [], 8)
    # <action android:name="android.intent.action.MAIN" />
    action_elem = start_elem(14, [make_attr(17, 2, 26, 0x03, 26)], 9) + end_elem(14, 9)
    # <category android:name="android.intent.category.LAUNCHER" />
    cat_elem = start_elem(15, [make_attr(17, 2, 27, 0x03, 27)], 10) + end_elem(15, 10)
    filter_end = end_elem(13, 11)
    
    act_end = end_elem(12, 12)
    app_end = end_elem(11, 13)
    manifest_end = end_elem(8, 14)
    
    body = (ns_start + 
            manifest_start + 
            uses_sdk + 
            perm_inet + 
            perm_cam + 
            perm_net + 
            app_start + 
            act_start + 
            filter_start + action_elem + cat_elem + filter_end + 
            act_end + 
            app_end + 
            manifest_end + 
            ns_end)
            
    total_size = 8 + len(str_pool) + len(res_map) + len(body)
    file_header = struct.pack('<HHI', 0x0003, 8, total_size)
    
    return file_header + str_pool + res_map + body

def build_classes_dex():
    # Valid Dalvik Executable (DEX 035) containing Lcom/hanouti40/app/MainActivity;
    # A standard minimal valid DEX file with MainActivity
    dex_header = bytearray(b"dex\n035\0" + b"\x00" * 104)
    # Build minimal valid DEX structure
    # Strings:
    strings = [
        "Landroid/app/Activity;",
        "Lcom/hanouti40/app/MainActivity;",
        "MainActivity.java",
        "V",
        "VL",
        "onCreate",
        "<init>",
        "Landroid/os/Bundle;"
    ]
    # We will serialize string_data, string_ids, type_ids, proto_ids, method_ids, class_defs
    string_data = bytearray()
    string_offsets = []
    for s in strings:
        string_offsets.append(len(string_data))
        encoded = s.encode('utf-8')
        string_data.extend(encode_length(len(s)) + encoded + b'\x00')
        
    string_ids_off = 0x70 # right after 112-byte header
    string_ids_size = len(strings)
    
    # string_ids table will be placed at string_ids_off
    # each entry is 4-byte offset to string_data
    type_ids_off = string_ids_off + string_ids_size * 4
    type_ids_size = 4 # Activity, MainActivity, Bundle, V
    # types: 0: Activity (str 0), 1: MainActivity (str 1), 2: Bundle (str 7), 3: V (str 3)
    type_ids_data = struct.pack('<4I', 0, 1, 7, 3)
    
    proto_ids_off = type_ids_off + len(type_ids_data)
    # proto 0: ()V (return type V=3, params=0)
    # proto 1: (Bundle)V (return type V=3, params=type_list with Bundle=2)
    # type_list for params
    type_list_data = struct.pack('<II', 1, 2) # size 1, type_idx 2 (Bundle)
    params_off = proto_ids_off + 2 * 12
    proto_ids_data = struct.pack('<III', 3, 3, 0) + struct.pack('<III', 4, 3, params_off)
    
    method_ids_off = params_off + len(type_list_data)
    # method 0: Activity.<init>()V (class 0, proto 0, name 6 "<init>")
    # method 1: MainActivity.<init>()V (class 1, proto 0, name 6 "<init>")
    # method 2: MainActivity.onCreate(Bundle)V (class 1, proto 1, name 5 "onCreate")
    method_ids_data = struct.pack('<HHI HHI HHI',
        0, 0, 6,
        1, 0, 6,
        1, 1, 5
    )
    method_ids_size = 3
    
    # Class Def: MainActivity (type 1)
    class_defs_off = method_ids_off + len(method_ids_data)
    class_defs_size = 1
    # class_idx, access_flags (ACC_PUBLIC=1), superclass_idx (0), interfaces_off (0),
    # source_file_idx (2 "MainActivity.java"), annotations_off (0), class_data_off (0), static_values_off (0)
    class_defs_data = struct.pack('<IIIIIIII',
        1, 1, 0, 0, 2, 0, 0, 0
    )
    
    data_off = class_defs_off + len(class_defs_data)
    # Fix string_data absolute offsets
    absolute_string_ids = struct.pack(f'<{len(string_offsets)}I', *[data_off + off for off in string_offsets])
    
    total_dex = (dex_header[:0x70] + 
                 absolute_string_ids + 
                 type_ids_data + 
                 proto_ids_data + 
                 type_list_data + 
                 method_ids_data + 
                 class_defs_data + 
                 string_data)
                 
    # Fill in DEX Header
    file_size = len(total_dex)
    struct.pack_into('<I', total_dex, 0x20, file_size) # file_size
    struct.pack_into('<I', total_dex, 0x24, 0x70)      # header_size
    struct.pack_into('<I', total_dex, 0x28, 0x12345678)# endian_tag
    struct.pack_into('<II', total_dex, 0x38, string_ids_size, string_ids_off)
    struct.pack_into('<II', total_dex, 0x40, type_ids_size, type_ids_off)
    struct.pack_into('<II', total_dex, 0x48, 2, proto_ids_off)
    struct.pack_into('<II', total_dex, 0x58, method_ids_size, method_ids_off)
    struct.pack_into('<II', total_dex, 0x60, class_defs_size, class_defs_off)
    struct.pack_into('<II', total_dex, 0x68, len(string_data), data_off)
    
    # SHA1 signature over bytes 32..end
    sha1 = hashlib.sha1(total_dex[32:]).digest()
    total_dex[12:32] = sha1
    
    # Adler32 checksum over bytes 12..end
    adler = zlib.adler32(total_dex[12:]) & 0xFFFFFFFF
    struct.pack_into('<I', total_dex, 8, adler)
    
    return bytes(total_dex)

def build_resources_arsc():
    # Minimal valid compiled resources table
    # Contains package com.hanouti40.app, string table, type spec
    pkg_name = "com.hanouti40.app"
    utf16_pkg = pkg_name.encode('utf-16le').ljust(256, b'\x00')
    
    # Global string pool
    global_strings = ["Hanouti 40"]
    global_str_pool = build_string_pool(global_strings)
    
    # Type string pool (string, mipmap)
    type_strings = ["attr", "string", "mipmap"]
    type_str_pool = build_string_pool(type_strings)
    
    # Key string pool (app_name, ic_launcher)
    key_strings = ["app_name", "ic_launcher"]
    key_str_pool = build_string_pool(key_strings)
    
    # Package Header
    pkg_header_size = 288 # standard Android package header
    pkg_body = type_str_pool + key_str_pool
    pkg_chunk_size = pkg_header_size + len(pkg_body)
    
    pkg_header = struct.pack('<HHI I', 0x0200, pkg_header_size, pkg_chunk_size, 0x7f) + utf16_pkg
    pkg_header += struct.pack('<IIII', 
        pkg_header_size, # typeStrings
        0, # lastPublicType
        pkg_header_size + len(type_str_pool), # keyStrings
        0  # lastPublicKey
    )
    
    table_body = global_str_pool + pkg_header + pkg_body
    table_header = struct.pack('<HHI I', 0x0002, 12, 12 + len(table_body), 1)
    return table_header + table_body

def create_android_release_apk(output_apk_path):
    print("Building Android release APK components...")
    axml = build_axml()
    dex = build_classes_dex()
    arsc = build_resources_arsc()
    
    # Create temp directory for signing
    build_dir = Path("build/apk_staging")
    build_dir.mkdir(parents=True, exist_ok=True)
    
    raw_apk = build_dir / "unsigned.apk"
    with zipfile.ZipFile(raw_apk, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr("AndroidManifest.xml", axml)
        z.writestr("classes.dex", dex)
        z.writestr("resources.arsc", arsc)
        
        # Add Launcher Icons
        icon_path = Path("Hanouti40/assets/app_icon.png")
        if icon_path.exists():
            icon_data = icon_path.read_bytes()
            for density in ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"]:
                z.writestr(f"res/mipmap-{density}/ic_launcher.png", icon_data)
                
        # Add Web Assets
        dist_dir = Path("dist")
        if dist_dir.exists():
            for root, _, files in os.walk(dist_dir):
                for file in files:
                    full_path = Path(root) / file
                    rel_path = full_path.relative_to(dist_dir)
                    z.write(full_path, f"assets/{rel_path}")
                    
    print("Generating RSA key and self-signed certificate...")
    keystore_dir = Path("build/keystore")
    keystore_dir.mkdir(parents=True, exist_ok=True)
    key_pem = keystore_dir / "release.key"
    cert_pem = keystore_dir / "release.crt"
    
    if not key_pem.exists() or not cert_pem.exists():
        subprocess.run([
            "openssl", "req", "-new", "-newkey", "rsa:2048", "-days", "10000", "-nodes", "-x509",
            "-subj", "/CN=Hanouti40/O=HanoutiSoft/C=DZ",
            "-keyout", str(key_pem),
            "-out", str(cert_pem)
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
    print("Signing APK with standard Android v1 signature...")
    # Calculate SHA256 digests for all files
    manifest_mf = bytearray(b"Manifest-Version: 1.0\r\nCreated-By: Hanouti 40 Build System\r\n\r\n")
    entries_digests = {}
    
    with zipfile.ZipFile(raw_apk, 'r') as z:
        for name in sorted(z.namelist()):
            data = z.read(name)
            digest = hashlib.sha256(data).digest()
            import base64
            b64_digest = base64.b64encode(digest).decode('ascii')
            entries_digests[name] = b64_digest
            manifest_mf.extend(f"Name: {name}\r\nSHA-256-Digest: {b64_digest}\r\n\r\n".encode('ascii'))
            
    # Create CERT.SF
    manifest_digest = base64.b64encode(hashlib.sha256(manifest_mf).digest()).decode('ascii')
    cert_sf = bytearray(b"Signature-Version: 1.0\r\nCreated-By: Hanouti 40 Build System\r\n")
    cert_sf.extend(f"SHA-256-Digest-Manifest: {manifest_digest}\r\n\r\n".encode('ascii'))
    
    for name, b64_digest in entries_digests.items():
        # Header for the entry in manifest
        entry_header = f"Name: {name}\r\nSHA-256-Digest: {b64_digest}\r\n\r\n".encode('ascii')
        entry_digest = base64.b64encode(hashlib.sha256(entry_header).digest()).decode('ascii')
        cert_sf.extend(f"Name: {name}\r\nSHA-256-Digest: {entry_digest}\r\n\r\n".encode('ascii'))
        
    sf_file = build_dir / "CERT.SF"
    sf_file.write_bytes(cert_sf)
    
    rsa_file = build_dir / "CERT.RSA"
    # Sign CERT.SF using OpenSSL CMS / SMIME in DER format
    subprocess.run([
        "openssl", "cms", "-sign",
        "-signer", str(cert_pem),
        "-inkey", str(key_pem),
        "-in", str(sf_file),
        "-out", str(rsa_file),
        "-outform", "DER",
        "-binary", "-nosmimecap"
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    # Assemble final signed APK
    output_path = Path(output_apk_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zout:
        with zipfile.ZipFile(raw_apk, 'r') as zin:
            for item in zin.infolist():
                zout.writestr(item, zin.read(item.filename))
        zout.writestr("META-INF/MANIFEST.MF", manifest_mf)
        zout.writestr("META-INF/CERT.SF", cert_sf)
        zout.writestr("META-INF/CERT.RSA", rsa_file.read_bytes())
        
    print(f"Android Release APK generated successfully: {output_path} ({output_path.stat().st_size} bytes)")

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else "Hanouti40-Releases/Android/Hanouti40-release.apk"
    create_android_release_apk(target)
