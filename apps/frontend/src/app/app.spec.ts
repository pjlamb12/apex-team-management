import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { NxWelcome } from './nx-welcome';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { ToastController } from '@ionic/angular/standalone';
import { Subject } from 'rxjs';

describe('App', () => {
	let mockToastCtrl: { create: any };
	let mockToast: { present: any };
	let versionUpdates$: Subject<any>;
	let unrecoverable$: Subject<any>;
	let mockSwUpdate: any;

	beforeEach(async () => {
		const mockRuntimeConfig = {
			getConfigObjectKey: vi.fn().mockReturnValue('http://api.test'),
		};

		mockToast = {
			present: vi.fn().mockResolvedValue(undefined),
		};

		mockToastCtrl = {
			create: vi.fn().mockResolvedValue(mockToast),
		};

		versionUpdates$ = new Subject();
		unrecoverable$ = new Subject();

		mockSwUpdate = {
			isEnabled: true,
			versionUpdates: versionUpdates$,
			unrecoverable: unrecoverable$,
			activateUpdate: vi.fn().mockResolvedValue(true),
			checkForUpdate: vi.fn().mockResolvedValue(true),
		};

		await TestBed.configureTestingModule({
			imports: [App, NxWelcome],
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([]),
				{ provide: RuntimeConfigLoaderService, useValue: mockRuntimeConfig },
				{ provide: SwUpdate, useValue: mockSwUpdate },
				{ provide: ToastController, useValue: mockToastCtrl },
			],
		}).compileComponents();
	});

	it('should create the app', () => {
		const fixture = TestBed.createComponent(App);
		const app = fixture.componentInstance;
		expect(app).toBeTruthy();
	});

	it('should activate update and present toast when VERSION_READY is emitted', async () => {
		const fixture = TestBed.createComponent(App);
		fixture.detectChanges();

		versionUpdates$.next({
			type: 'VERSION_READY',
			currentVersion: { hash: 'v1' },
			latestVersion: { hash: 'v2' },
		} as VersionReadyEvent);

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(mockSwUpdate.activateUpdate).toHaveBeenCalled();
		expect(mockToastCtrl.create).toHaveBeenCalledWith(
			expect.objectContaining({
				message: 'A new version of Apex Team is ready.',
				position: 'bottom',
				color: 'primary',
			})
		);
		expect(mockToast.present).toHaveBeenCalled();
	});

	it('should call checkForUpdate when visibilitychange fires and document is visible', () => {
		const fixture = TestBed.createComponent(App);
		fixture.detectChanges();

		const spy = vi.spyOn(fixture.componentInstance as any, 'checkForUpdate');
		document.dispatchEvent(new Event('visibilitychange'));

		expect(spy).toHaveBeenCalled();
	});
});

