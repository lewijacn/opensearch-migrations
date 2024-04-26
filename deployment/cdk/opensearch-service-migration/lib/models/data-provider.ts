export enum AuthType {
    NO_AUTH = 'NO_AUTH',
    BASIC_AUTH = 'BASIC_AUTH',
    SIGV4_AUTH = 'SIGV4_AUTH'
}

export enum ProviderType {
    SELF_MANAGED = 'SELF_MANAGED',
    OPENSEARCH_SERVICE = 'OPENSEARCH_SERVICE',
    OPENSEARCH_SERVERLESS = 'OPENSEARCH_SERVERLESS'
}

export class DataProvider {
    endpoint: string;
    authType: AuthType;
    providerType: ProviderType;
    authUsername?: string;
    authSecret?: string;

    constructor(endpoint: string, authType: AuthType, providerType: ProviderType, authUsername?: string, authSecret?: string) {
        this.endpoint = endpoint
        this.authType = authType
        this.providerType = providerType
        this.authUsername = authUsername
        this.authSecret = authSecret
    }

}

export function validateAndReturnSourceDataProvider(endpoint?: string, authTypeString?: string, providerTypeString?: string, authUsername?: string, authSecret?: string): DataProvider {

    if (!endpoint || !authTypeString || !providerTypeString) {
        throw new Error("The following source data provider context options are required: [sourceEndpoint, sourceAuthType, sourceProviderType]")
    }

    const authTypeEnum: AuthType = AuthType[authTypeString as keyof typeof AuthType];
    const providerTypeEnum: ProviderType = ProviderType[providerTypeString as keyof typeof ProviderType];

    if (authTypeEnum === AuthType.BASIC_AUTH && (!authUsername || !authSecret)) {
        throw new Error("When the BASIC_AUTH sourceAuthType is specified, the following options are required: [sourceAuthUsername, sourceAuthSecret]")
    }

    return new DataProvider(endpoint, authTypeEnum, providerTypeEnum, authUsername, authSecret)

}

export function validateAndReturnTargetDataProvider(endpoint: string, authTypeString?: string, providerTypeString?: string, authUsername?: string, authSecret?: string): DataProvider {

    if (!authTypeString || !providerTypeString) {
        throw new Error("The following target data provider context options are required: [targetAuthType, targetProviderType]")
    }

    const authTypeEnum: AuthType = AuthType[authTypeString as keyof typeof AuthType];
    const providerTypeEnum: ProviderType = ProviderType[providerTypeString as keyof typeof ProviderType];

    if (authTypeEnum === AuthType.BASIC_AUTH && (!authUsername || !authSecret)) {
        throw new Error("When the BASIC_AUTH targetAuthType is specified, the following options are required: [targetAuthUsername, targetAuthSecret]")
    }

    return new DataProvider(endpoint, authTypeEnum, providerTypeEnum, authUsername, authSecret)

}