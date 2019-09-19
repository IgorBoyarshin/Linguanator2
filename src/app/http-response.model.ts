export interface TokenEntry {
    idToken: string;
    expiresAt: string;
}

export interface Response<T> {
    tokenEntry: TokenEntry;
    data: T;
    isAdmin: boolean;
}
