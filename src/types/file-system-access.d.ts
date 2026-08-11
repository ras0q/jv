export {};

declare global {
  interface FileSystemHandlePermissionDescriptor {
    mode?: "read" | "readwrite";
  }

  interface FileSystemHandle {
    queryPermission(
      descriptor?: FileSystemHandlePermissionDescriptor,
    ): Promise<PermissionState>;
    requestPermission(
      descriptor?: FileSystemHandlePermissionDescriptor,
    ): Promise<PermissionState>;
  }

  interface Window {
    showDirectoryPicker(
      options?: { mode?: "read" | "readwrite" },
    ): Promise<FileSystemDirectoryHandle>;
    __JOURNAL_VIEWER_TEST_DATA__?: Record<string, string>;
  }

  var showDirectoryPicker: Window["showDirectoryPicker"];
  var __JOURNAL_VIEWER_TEST_DATA__: Record<string, string> | undefined;
}
