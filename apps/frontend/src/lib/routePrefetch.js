export const routeLoaders = {
  adminLogin: () => import('../views/AdminLogin'),
  dashboard: () => import('../views/Dashboard'),
  questions: () => import('../views/QuestionBank'),
  ranking: () => import('../views/GlobalRanking'),
  gameControl: () => import('../views/admin/GameControl'),
  users: () => import('../views/UserManagement'),
  participantLogin: () => import('../views/participant/ParticipantLogin'),
  enterPin: () => import('../views/participant/EnterPin'),
  liveQuestion: () => import('../views/participant/LiveQuestion'),
  feedback: () => import('../views/participant/Feedback'),
  waitingLobby: () => import('../views/participant/WaitingLobby'),
  eliminated: () => import('../views/participant/Eliminated'),
};

const prefetchedRoutes = new Set();

function schedule(task) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(task, { timeout: 1500 });
    return;
  }

  window.setTimeout(task, 250);
}

export function prefetchRoute(routeName) {
  const loader = routeLoaders[routeName];
  if (!loader || prefetchedRoutes.has(routeName)) return;

  prefetchedRoutes.add(routeName);
  schedule(() => {
    loader().catch(() => {
      prefetchedRoutes.delete(routeName);
    });
  });
}

export function prefetchAdminRoutes() {
  ['questions', 'users', 'ranking', 'gameControl'].forEach(prefetchRoute);
}
