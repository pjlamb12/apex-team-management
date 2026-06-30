import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withComponentInputBinding, withRouterConfig, RouteReuseStrategy } from '@angular/router';
import { provideIonicAngular, IonicRouteStrategy } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRuntimeConfig, RuntimeConfigLoaderService } from 'runtime-config-loader';
import { provideServiceWorker } from '@angular/service-worker';
import { appRoutes } from './app.routes';
import { authInterceptor } from './auth/auth.interceptor';

export function patchRuntimeConfig(config: RuntimeConfigLoaderService) {
  return () => {
    const originalGet = config.getConfigObjectKey.bind(config);
    config.getConfigObjectKey = (key: string) => {
      const val = originalGet(key);
      if (key === 'apiBaseUrl' && typeof val === 'string') {
        const currentHost = window.location.hostname;
        if (currentHost !== 'localhost' && currentHost !== '127.0.0.1' && val.includes('localhost:3000')) {
          return val.replace('localhost:3000', `${currentHost}:3000`);
        }
      }
      return val;
    };
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({}),
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withRouterConfig({ paramsInheritanceStrategy: 'always' })
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRuntimeConfig({
      configUrl: './assets/config/config.json',
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: patchRuntimeConfig,
      deps: [RuntimeConfigLoaderService],
      multi: true,
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],
};
