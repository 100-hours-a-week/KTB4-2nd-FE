import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** 401을 API 결과로 처리하고 자동 토큰 재발급을 하지 않는 요청에 사용합니다. */
    skipAuthRefresh?: boolean;
  }
}
