import {
    LunchOption,
    LunchRecord,
    WeightedOption,
    LunchPreferences,
    WeightBreakdown,
} from './types';
import { intersect } from 'core/util/array';

/**
 * Lunch decision criteria
 *
 * x n days since last time the option was chosen (successfully)
 * x n/4 days since last time the category was chosen
 * x 1/n total times chosen
 */
export const decide = (
    options: LunchOption[],
    history: LunchRecord[],
    today: LunchRecord,
    userPreferences: Record<string, LunchPreferences>
): WeightedOption => {
    const weightedOptions = options.map(option => ({
        ...option,
        weight: weight(option, history, today, userPreferences),
    }));

    return select(weightedOptions);
};

const sortDate = ({ date: dateA }, { date: dateB }) =>
    new Date(dateA) > new Date(dateB) ? -1 : 1;

const days = (diff: number) => diff / (1000 * 60 * 60 * 24);

export const weight = (
    target: LunchOption,
    history: LunchRecord[],
    today: LunchRecord,
    userPreferences: Record<string, LunchPreferences>,
    breakdown?: WeightBreakdown
): number => {
    const visits = history
        .filter(({ option }) => option?.name === target.name)
        .sort(sortDate);

    const now = new Date().getTime();

    const daysSinceLastVisit =
        days(now - new Date((visits[0] || {}).date).getTime()) ||
        20 + 10 * Math.random();

    if (breakdown) {
        breakdown.daysSinceLastVisit = daysSinceLastVisit;
        breakdown.actualDaysSinceLastVisit = days(
            now - new Date((visits[0] || {}).date).getTime()
        );
    }

    const categoryVisits = history
        .filter(({ option }) => option?.category === target.category)
        .sort(sortDate);

    const daysSinceLastCategory =
        days(now - new Date((categoryVisits[0] || {}).date).getTime()) ||
        20 + 10 * Math.random();

    if (breakdown) {
        breakdown.daysSinceLastCategoryVisit = daysSinceLastCategory;
        breakdown.actualDaysSinceLastCategoryVisit = days(
            now - new Date((categoryVisits[0] || {}).date).getTime()
        );
    }

    let weight = daysSinceLastVisit + daysSinceLastCategory / 4;

    if (breakdown) {
        breakdown.weightBasedOnHistory = weight;
    }

    if (today.participants.length > 0) {
        const preferences = today.participants.reduce((prefs, id) => {
            const userPrefs = userPreferences[id] ?? {};
            Object.keys(userPrefs).forEach(pref => {
                // required
                if (userPrefs[pref]) prefs[pref] = true;
                // optional
                // fuck this is weird logic
                if (!prefs[pref]) prefs[pref] = false;
            });
            return prefs;
        }, {});

        const required = Object.keys(preferences).filter(p => preferences[p]);
        const optional = Object.keys(preferences).filter(p => !preferences[p]);

        if (
            required.length > 0 &&
            intersect(target.attributes ?? [], required).length === 0
        ) {
            if (breakdown) {
                breakdown.failsRequiredPreferences = required.join(', ');
            }
            // have requirements, no attributes match!
            return 0;
        }

        if (intersect(target.attributes ?? [], optional).length > 0) {
            if (breakdown) {
                breakdown.matchesOptionalPreferences = intersect(
                    target.attributes ?? [],
                    optional
                ).join(', ');
                breakdown.optionalPreferenceMultiplier = 2;
            }
            // bump up preferred options
            weight *= 2;
        }
    }

    return weight;
};

const select = (options: WeightedOption[]): WeightedOption => {
    const totalWeight = options.reduce(
        (total, option) => total + option.weight,
        0
    );

    let pickPoint = Math.random() * totalWeight;

    return options.reduce((selected, option) => {
        pickPoint -= option.weight;
        if (pickPoint <= 0) {
            pickPoint = 9999999999;
            return {
                ...option,
                weight: Number(
                    ((option.weight / totalWeight) * 100).toFixed(2)
                ),
            };
        }
        return selected;
    }, options[0]);
};
