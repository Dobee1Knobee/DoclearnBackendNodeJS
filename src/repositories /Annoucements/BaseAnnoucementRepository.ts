import { BaseAnnouncement, BaseAnnouncementModel } from "../../models/Announcements/BaseAnnouncement";
import {ApiError} from "@/errors/ApiError";
import {ConferenceModel} from "@/models/Announcements/Conference";
import {WebinarModel} from "@/models/Announcements/Webinar";

export interface IBaseAnnouncementRepository {
    // Существующие методы (стоит доработать)
    createBaseAnnouncement(data: CreateAnnouncementDTO, organizer_id: string): Promise<BaseAnnouncement>;
    deleteBaseAnnouncement(id: string, user_id: string): Promise<void>;
    updateBaseAnnouncement(id: string, data: UpdateAnnouncementDTO,user_id:string): Promise<BaseAnnouncement>;

    // Методы для получения данных
    getById(id: string): Promise<BaseAnnouncement | null>;
    getByOrganizer(organizerId: string): Promise<BaseAnnouncement[]>;
    getAll(filters?: AnnouncementFilters): Promise<BaseAnnouncement[]>;

    // Методы для работы со статусами
    updateStatus(id: string, status: AnnouncementStatus, moderationNotes?: string): Promise<void>;
    getByStatus(status: AnnouncementStatus): Promise<BaseAnnouncement[]>;
//TODO:написать эти методы в admin side
    // // Методы модерации
    // approveAnnouncement(id: string, moderatorId: string): Promise<void>;
    // rejectAnnouncement(id: string, moderatorId: string, notes: string): Promise<void>;

    // Методы для активности
    getActiveAnnouncements(date?: Date): Promise<BaseAnnouncement[]>;
    getExpiredAnnouncements(date?: Date): Promise<BaseAnnouncement[]>;
    archiveExpired(): Promise<number>; // возвращает количество архивированных

    // Поиск и фильтрация
    search(query: string, filters?: AnnouncementFilters): Promise<BaseAnnouncement[]>;
    getByDateRange(from: Date, to: Date): Promise<BaseAnnouncement[]>;

    // Пагинация
    getPaginated(page: number, limit: number, filters?: AnnouncementFilters): Promise<{
        data: BaseAnnouncement[];
        total: number;
        page: number;
        totalPages: number;
    }>;

    // Статистика
    getCountByStatus(): Promise<Record<AnnouncementStatus, number>>;
    getCountByOrganizer(organizerId: string): Promise<number>;
}

// Типы для методов
interface CreateAnnouncementDTO {
    title: string;
    description: string;
    organizer: string;
    activeFrom?: Date;
    activeTo?: Date;
    type: 'Conference' | 'Webinar' | 'Vacancy';
}

interface UpdateAnnouncementDTO {
    title?: string;
    description?: string;
    activeFrom?: Date;
    activeTo?: Date;
    status?: AnnouncementStatus;
    moderationNotes?: string;
}

interface AnnouncementFilters {
    status?: AnnouncementStatus[];
    organizer?: string;
    type?: string[];
    dateFrom?: Date;
    dateTo?: Date;
    tags?: string[];
}

type AnnouncementStatus = 'draft' | 'pending' | 'approved' | 'published' | 'rejected' | 'archived' | 'moderator_removed';

export class BaseAnnouncementRepository implements  IBaseAnnouncementRepository{

    private getModelByType(type: string): typeof BaseAnnouncementModel {
        switch(type) {
            case 'Conference':
                return ConferenceModel as typeof BaseAnnouncementModel;
            case 'Webinar':
                return WebinarModel as typeof BaseAnnouncementModel;
            default:
                return BaseAnnouncementModel;
        }
    }

    async createBaseAnnouncement(data: CreateAnnouncementDTO, organizer_id: string): Promise<BaseAnnouncement> {
        if (!data || !organizer_id) {
            throw new ApiError(400, 'Организатор или данные для создания не переданы');
        }

        const Model = this.getModelByType(data.type);

        try {
            const res = await Model.create({
                ...data,
                organizer: organizer_id
            }) as BaseAnnouncement;

            return res;
        } catch (error) {
            throw new ApiError(500, "Что-то при создании объявления пошло не так");
        }
    }

    async deleteBaseAnnouncement(id: string, user_id: string): Promise<void> {
        if (!id || !user_id) {
            throw new ApiError(400, "Не был передан id или user_id");
        }

        try {
            const announcement = await BaseAnnouncementModel.findOne({
                _id: id,
                organizer: user_id
            });

            if (!announcement) {
                throw new ApiError(404, "Объявление не найдено или у вас нет прав для его удаления");
            }

            await BaseAnnouncementModel.deleteOne({ _id: id });
        } catch (error) {
            if (error instanceof ApiError) {
                throw error; // Пробрасываем наши ошибки
            }
            throw new ApiError(500, "Что-то при удалении объявления пошло не так");
        }
    }

    async getActiveAnnouncements(date?: Date): Promise<BaseAnnouncement[]> {
        // Используем переданную дату или текущую
        const currentDate = date || new Date();

        try {
            const res = await BaseAnnouncementModel.find({
                status: { $in: ['published', 'approved'] }, // оба статуса
                activeFrom: { $lte: currentDate },
                $or: [
                    { activeTo: { $gte: currentDate } },
                    { activeTo: { $exists: false } },
                    { activeTo: null }
                ]
            }).populate('organizer', 'name email').sort({activeFrom: 1});

            return res;
        } catch (error) {
            throw new ApiError(500, "Ошибка при получении активных объявлений");
        }
    }

    getAll(filters?: AnnouncementFilters): Promise<BaseAnnouncement[]> {
        return Promise.resolve([]);
    }

    getByDateRange(from: Date, to: Date): Promise<BaseAnnouncement[]> {
        return Promise.resolve([]);
    }
    getById(id: string): Promise<BaseAnnouncement | null> {
        return Promise.resolve(null); // null вместо undefined
    }

    getByOrganizer(organizerId: string): Promise<BaseAnnouncement[]> {
        return Promise.resolve([]);
    }

    getByStatus(status: AnnouncementStatus): Promise<BaseAnnouncement[]> {
        return Promise.resolve([]);
    }

    getCountByOrganizer(organizerId: string): Promise<number> {
        return Promise.resolve(0);
    }

    getCountByStatus(): Promise<Record<AnnouncementStatus, number>> {
        // Возвращаем объект с правильной структурой
        return Promise.resolve({
            draft: 0,
            pending: 0,
            approved: 0,
            published: 0,
            rejected: 0,
            archived: 0,
            moderator_removed: 0
        } as Record<AnnouncementStatus, number>);
    }

    getExpiredAnnouncements(date?: Date): Promise<BaseAnnouncement[]> {
        return Promise.resolve([]);
    }

    getPaginated(page: number, limit: number, filters?: AnnouncementFilters): Promise<{
        data: BaseAnnouncement[];
        total: number;
        page: number;
        totalPages: number
    }> {
        return Promise.resolve({data: [], page: 0, total: 0, totalPages: 0});
    }



    search(query: string, filters?: AnnouncementFilters): Promise<BaseAnnouncement[]> {
        return Promise.resolve([]);
    }
    updateBaseAnnouncement(id: string, data: UpdateAnnouncementDTO): Promise<BaseAnnouncement> {
        // Для методов, которые должны возвращать BaseAnnouncement, лучше кинуть ошибку
        throw new Error("Method not implemented");

        // Или если хотите заглушку с правильным типом:
        // return Promise.reject(new Error("Method not implemented"));
    }
    updateStatus(id: string, status: AnnouncementStatus, moderationNotes?: string): Promise<void> {
        return Promise.resolve(undefined);
    }

    archiveExpired(): Promise<number> {
        return Promise.resolve(0);
    }
}
