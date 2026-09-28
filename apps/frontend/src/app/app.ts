import { Component, inject, effect, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { ToastController } from '@ionic/angular/standalone';
import { ThemeService } from '@apex-team/client/ui/theme';
import { AuthService } from './auth/auth.service';
import { SocketService } from './shared/services/socket.service';
import { filter, Subscription } from 'rxjs';

@Component({
	imports: [RouterModule],
	selector: 'app-root',
	templateUrl: './app.html',
	styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
	protected title = 'frontend';
	private _theme = inject(ThemeService);
	private _auth = inject(AuthService);
	private _socket = inject(SocketService);
	private _swUpdate = inject(SwUpdate);
	private _toastCtrl = inject(ToastController);
	private _subs = new Subscription();
	private _intervalId: any = null;
	private _visibilityHandler = () => this.checkForUpdate();

	constructor() {
		effect(() => {
			if (this._auth.isAuthenticated()) {
				this._socket.connect();
			} else {
				this._socket.disconnect();
			}
		});
	}

	ngOnInit(): void {
		if (this._swUpdate.isEnabled) {
			this._subs.add(
				this._swUpdate.versionUpdates
					.pipe(
						filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
					)
					.subscribe(async () => {
						try {
							await this._swUpdate.activateUpdate();
						} catch (err) {
							console.warn('Failed to activate service worker update', err);
						}
						await this.showUpdateToast();
					})
			);

			this._subs.add(
				this._swUpdate.unrecoverable.subscribe(() => {
					window.location.reload();
				})
			);

			if (typeof document !== 'undefined') {
				document.addEventListener('visibilitychange', this._visibilityHandler);
			}
			if (typeof window !== 'undefined') {
				window.addEventListener('focus', this._visibilityHandler);
				// Periodically check for updates every 30 minutes while app is running
				this._intervalId = setInterval(() => this.checkForUpdate(), 30 * 60 * 1000);
			}
		}
	}

	ngOnDestroy(): void {
		this._subs.unsubscribe();
		if (typeof document !== 'undefined') {
			document.removeEventListener('visibilitychange', this._visibilityHandler);
		}
		if (typeof window !== 'undefined') {
			window.removeEventListener('focus', this._visibilityHandler);
		}
		if (this._intervalId) {
			clearInterval(this._intervalId);
		}
	}

	protected checkForUpdate(): void {
		if (typeof document !== 'undefined' && document.visibilityState === 'visible' && this._swUpdate.isEnabled) {
			this._swUpdate.checkForUpdate().catch((err) => {
				console.warn('Failed to check for updates', err);
			});
		}
	}

	protected async showUpdateToast(): Promise<void> {
		const toast = await this._toastCtrl.create({
			message: 'A new version of Apex Team is ready.',
			position: 'bottom',
			color: 'primary',
			duration: 0,
			buttons: [
				{
					text: 'Update Now',
					role: 'confirm',
					handler: () => {
						window.location.reload();
					},
				},
				{
					text: 'Dismiss',
					role: 'cancel',
				},
			],
		});
		await toast.present();
	}
}
