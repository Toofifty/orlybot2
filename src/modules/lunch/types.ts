export type WeightedOption = LunchOption & { weight: number };

export interface LunchOption {
    name: string;
    category: string;
    icon?: string;
    attributes?: string[];
}

export interface LunchRecord {
    option: LunchOption | null;
    date: string;
    /** list of user IDs */
    participants: string[];
    successful: boolean;
    rerollVoters?: string[];
    rating?: number;
}

export interface LunchPreferences {
    /**
     * true if required preference (vegan, vegetarian),
     * false if non-required
     */
    [name: string]: boolean;
}

export interface LunchStore {
    today: LunchRecord;
    history: LunchRecord[];
    options: LunchOption[];
    categories: string[];
    userPreferences: Record<string, LunchPreferences>;
}

export interface WeightBreakdown {
    daysSinceLastVisit?: number;
    actualDaysSinceLastVisit?: number;
    daysSinceLastCategoryVisit?: number;
    actualDaysSinceLastCategoryVisit?: number;
    weightBasedOnHistory?: number;
    failsRequiredPreferences?: string;
    matchesOptionalPreferences?: string;
    optionalPreferenceMultiplier?: number;
    finalWeight?: number;
}
