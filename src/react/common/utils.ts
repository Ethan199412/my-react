export const generateUuid = () => {
    return Math.random().toString(36).substring(10)
}