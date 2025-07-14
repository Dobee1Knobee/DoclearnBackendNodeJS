const FILE_CONFIGS = {
    avatar: {
        maxSize: 5 * 1024 * 1024,
        types: ["image/png", "image/jpeg"],
        folder: "avatars",
        signedUrlExpiry: 15 * 60 * 1000, // 15 минут

    },
    document: {
        maxSize: 10 * 1024 * 1024,
        types: ["application/pdf", "image/png", "image/jpeg"],
        folder: "documents",
        signedUrlExpiry: 5 * 60 * 1000, // 5 минут

    },
    documentProfile: {
        maxSize: 10 * 1024 * 1024,
        types: ["application/pdf", "image/png", "image/jpeg"],
        folder: "documentsProfile",
        signedUrlExpiry: 5 * 60 * 1000, // 15 минут

    },
    postImage: {
        maxSize: 10 * 1024 * 1024,
        types: ["image/png", "image/jpeg"],
        folder: "posts",
        signedUrlExpiry: 15 * 60 * 1000, // 15 минут

    }
}
export { FILE_CONFIGS };
export type FileType = keyof typeof FILE_CONFIGS;
