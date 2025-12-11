export const Close = {};
export const Document = {};
export const FolderOpen = {};
export const Information = {};
export const Warning = {};
export const ErrorFilled = {};
export const Add = {};
export const Edit = {};
export const TrashCan = {};
// Add a proxy to handle any other icons
export default new Proxy({}, {
    get: () => ({})
});
