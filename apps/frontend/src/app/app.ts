import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ThemeService } from '@apex-team/client/ui/theme';

@Component({
	imports: [RouterModule],
	selector: 'app-root',
	templateUrl: './app.html',
	styleUrl: './app.scss',
})
export class App {
	protected title = 'frontend';
	private _theme = inject(ThemeService);
}
