import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { NxWelcome } from './nx-welcome';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';

describe('App', () => {
	beforeEach(async () => {
		const mockRuntimeConfig = {
			getConfigObjectKey: vi.fn().mockReturnValue('http://api.test'),
		};

		await TestBed.configureTestingModule({
			imports: [App, NxWelcome],
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([]),
				{ provide: RuntimeConfigLoaderService, useValue: mockRuntimeConfig },
			],
		}).compileComponents();
	});

	it('should create the app', () => {
		const fixture = TestBed.createComponent(App);
		const app = fixture.componentInstance;
		expect(app).toBeTruthy();
	});
});
