export const AsyncSome = async <T>(collection: Array<T>, fn: (a: T) => Promise<boolean>) => {
    const r = await Promise.all(collection.map(o => fn(o)));
    return r.some(b => b);
};