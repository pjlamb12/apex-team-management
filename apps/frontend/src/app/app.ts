import { Component, inject, effect } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { ThemeService } from '@apex-team/client/ui/theme';
import { AuthService } from './auth/auth.service';
import { SocketService } from './shared/services/socket.service';
import { filter } from 'rxjs';

@Component({
	imports: [RouterModule],
	selector: 'app-root',
	templateUrl: './app.html',
	styleUrl: './app.scss',
})
export class App {
	protected title = 'frontend';
	private _theme = inject(ThemeService);
	private _auth = inject(AuthService);
	private _socket = inject(SocketService);
	private _swUpdate = inject(SwUpdate);

	constructor() {
		effect(() => {
			if (this._auth.isAuthenticated()) {
				this._socket.connect();
			} else {
				this._socket.disconnect();
			}
		});

		if (this._swUpdate.isEnabled) {
			this._swUpdate.versionUpdates
				.pipe(
					filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
				)
				.subscribe(() => {
					if (confirm('A new version of Apex Team is available. Load new version?')) {
						window.location.reload();
					}
				});
		}
	}
}
