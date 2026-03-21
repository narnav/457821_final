export function ratingToTier(rating) {
    if (rating >= 1800)
        return "DIAMOND";
    if (rating >= 1500)
        return "PLATINUM";
    if (rating >= 1300)
        return "GOLD";
    if (rating >= 1100)
        return "SILVER";
    return "BRONZE";
}
