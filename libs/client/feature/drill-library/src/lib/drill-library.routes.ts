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
    path: ':drillId',
    component: DrillDetail,
  },
  {
    path: ':drillId/edit',
    component: DrillEditor,
  },
];
