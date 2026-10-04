export const shortenPlaceName = (displayName) => {
    return displayName.split(",").slice(0, 2).join(",").trim();
}
