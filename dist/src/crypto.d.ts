export interface CryptoConfig {
    token: string;
    aesKey: string;
    corpId: string;
}
export declare class WeComCrypto {
    private readonly token;
    private readonly aesKey;
    private readonly iv;
    private readonly corpId;
    constructor(config: CryptoConfig);
    /**
     * 验证签名
     */
    verifySignature(signature: string, timestamp: string, nonce: string, encrypted?: string): boolean;
    /**
     * 计算签名
     */
    calculateSignature(timestamp: string, nonce: string, encrypted?: string): string;
    /**
     * 解密消息
     */
    decrypt(encrypted: string): {
        message: string;
        corpId: string;
    };
    /**
     * 加密消息
     */
    encrypt(message: string): string;
    /**
     * 生成加密回复
     */
    encryptReply(replyMsg: string, timestamp: string, nonce: string): string;
    private pkcs7Pad;
    private pkcs7Unpad;
}
export declare function generateNonce(): string;
export declare function getTimestamp(): string;
//# sourceMappingURL=crypto.d.ts.map