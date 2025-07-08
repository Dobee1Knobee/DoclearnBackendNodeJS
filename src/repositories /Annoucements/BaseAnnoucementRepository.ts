export interface IBaseAnnouncementRepository {
    createBaseAnnouncement(userId: string): Promise<void>;

}