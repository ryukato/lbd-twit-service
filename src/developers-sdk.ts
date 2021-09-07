import * as Sdk from '@line/lbd-sdk-js';

class SdkClient {
    private lbdSdkHttpClient: Sdk.HttpClient;
    
    public sdkHttpClient(config: SdkClientConfig): Sdk.HttpClient {
        if (!this.lbdSdkHttpClient) {
            this.lbdSdkHttpClient = new Sdk.HttpClient(config.host, config.apiKey, config.apiSecret);    
        }
        return this.lbdSdkHttpClient;
    }
}

class SdkClientConfig {
    constructor(readonly host: string, readonly apiKey: string, readonly apiSecret:string) {}
}

const sdkClient = new SdkClient();
export { sdkClient };