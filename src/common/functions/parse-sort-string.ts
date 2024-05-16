export function parseSortString(sortString) {
    // Regular expression to extract the field name and the sort order
    const match = /(\w+)(Asc|Desc)$/i.exec(sortString);

    if (!match) {
        throw new Error("Invalid sort string");
    }

    // Extract parts from the regular expression match
    const [, field, sortOrder] = match;

    // Convert 'Asc' or 'Desc' to lowercase for consistency
    const normalizedSortOrder = sortOrder.toLowerCase();

    // Return the result as an object
    return {
        orderBy: field,
        sortOrder: normalizedSortOrder === 'asc' ? 'asc' : 'desc'
    };
}