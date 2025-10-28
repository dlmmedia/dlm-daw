# DLM DAW File System

DLM DAW stores your projects and samples in the
[Origin private file system](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system) (
OPFS).

## Why Samples?

DLM DAW uses the OPFS to store user-imported samples because modern browsers do not retain
information about the file origins of imported local files due to security restrictions. This means that once a user
imports a file, the browser has no way to automatically reload it the next time DLM DAW starts. To ensure persistent
access to user samples, DLM DAW copies every imported sample into OPFS, allowing the application to manage and retrieve
these files securely without relying on external file paths.

## Granting OPFS Storage Permission in Firefox
In Firefox, storing data in OPFS requires explicit user approval due to its privacy settings. Without permission, DLM DAW may not be able to retain imported samples across sessions. To allow persistent storage for DLM DAW in Firefox, follow these steps:

* Open Firefox Settings
* Navigate to Privacy & Security
* Scroll down to Permissions and find Storage Permissions
* Click Exceptions and enter the DLM DAW studio URL `https://dlm-daw.studio`
* Select Allow and confirm the changes
* Restart Firefox for the settings to take effect