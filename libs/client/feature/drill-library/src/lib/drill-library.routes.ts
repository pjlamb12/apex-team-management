import { Routes } from '@angular/router';
import { DrillList } from './drill-list/drill-list';
import { DrillDetail } from './drill-detail/drill-detail';
import { DrillEditor } from './drill-editor/drill-editor';

export const DRILL_LIBRARY_ROUTES: Routes = [
  {
    path: '',
    component: DrillList,
  },
  {
    path: 'new',
    component: DrillEditor,
  },
  {
    path: ':id',
    component: DrillDetail,
  },
  {
    path: ':id/edit',
    component: DrillEditor,
  },
];
