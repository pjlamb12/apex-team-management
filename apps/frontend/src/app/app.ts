import { Component, inject, effect } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ThemeService } from '@apex-team/client/ui/theme';
import { AuthService } from './auth/auth.service';
import { SocketService } from './shared/services/socket.service';

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

	constructor() {
		effect(() => {
			if (this._auth.isAuthenticated()) {
				this._socket.connect();
			} else {
				this._socket.disconnect();
			}
		});
	}
}
