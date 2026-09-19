#!/usr/bin/env python3
"""Upload a file to Google Drive using the GDRIVE_SA_JSON service account key.

Requires: pip install google-api-python-client google-auth
Replaces a file of the same name in the folder instead of creating a duplicate.
"""
import json
import mimetypes
import os
import sys

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload


def main():
    if len(sys.argv) != 3:
        sys.exit('usage: gdrive-upload.py <file> <folder-id>')
    path, folder = sys.argv[1], sys.argv[2]

    key = os.environ.get('GDRIVE_SA_JSON')
    if not key:
        sys.exit('GDRIVE_SA_JSON is not set')

    creds = service_account.Credentials.from_service_account_info(
        json.loads(key), scopes=['https://www.googleapis.com/auth/drive']
    )
    drive = build('drive', 'v3', credentials=creds).files()

    name = os.path.basename(path)
    mime = mimetypes.guess_type(path)[0] or 'application/octet-stream'
    media = MediaFileUpload(path, mimetype=mime, resumable=True)

    escaped = name.replace("\\", "\\\\").replace("'", "\\'")
    existing = drive.list(
        q=f"name = '{escaped}' and '{folder}' in parents and trashed = false",
        fields='files(id)',
        supportsAllDrives=True,
        includeItemsFromAllDrives=True,
    ).execute()['files']

    if existing:
        f = drive.update(fileId=existing[0]['id'], media_body=media,
                         fields='id,webViewLink', supportsAllDrives=True).execute()
    else:
        f = drive.create(body={'name': name, 'parents': [folder]}, media_body=media,
                         fields='id,webViewLink', supportsAllDrives=True).execute()

    print(f['webViewLink'])


if __name__ == '__main__':
    main()
