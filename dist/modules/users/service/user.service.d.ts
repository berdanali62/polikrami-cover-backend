import { UpdateProfileDto } from '../dto/profile.dto';
export declare class UserService {
    me(userId: string): Promise<{
        id: string;
        email: string;
        name: string | null;
        avatarUrl: string | null;
        profile: {
            phone: any;
            phoneVerifiedAt: any;
            company: any;
            address1: any;
            address2: any;
            city: any;
            state: any;
            postalCode: any;
            country: any;
            preferences: any;
            isArtist: any;
            specialization: any;
            revenueShareAcceptedAt: any;
            artistBio: any;
            isAvailable: any;
            iban: any;
            behanceUrl: any;
            dribbbleUrl: any;
            linkedinUrl: any;
            websiteUrl: any;
        } | null;
    }>;
    updateProfile(userId: string, data: UpdateProfileDto): Promise<{
        userId: string;
        phone: string | null;
        phoneVerifiedAt: Date | null;
        company: string | null;
        address1: string | null;
        address2: string | null;
        city: string | null;
        state: string | null;
        postalCode: string | null;
        country: string | null;
        preferences: import("@prisma/client/runtime/library").JsonValue | null;
        isArtist: boolean | null;
        specialization: string | null;
        revenueShareAcceptedAt: Date | null;
        artistBio: string | null;
        isAvailable: boolean;
        iban: string | null;
        behanceUrl: string | null;
        dribbbleUrl: string | null;
        linkedinUrl: string | null;
        websiteUrl: string | null;
    } | null>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        readonly ok: false;
        readonly message: "Mevcut şifre hatalı";
    } | {
        readonly ok: true;
        readonly message?: undefined;
    }>;
}
