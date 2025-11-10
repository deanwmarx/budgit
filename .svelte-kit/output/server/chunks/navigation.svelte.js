import "clsx";
const SCREENS = {
  CREATE_HOUSEHOLD: "create-household",
  DASHBOARD: "dashboard",
  TRANSACTIONS: "transactions",
  BUDGETS: "budgets",
  MEMBERS: "members",
  SETTINGS: "settings"
};
class NavigationState {
  /** @type {ScreenType} */
  current_screen = SCREENS.DASHBOARD;
  /** @type {ScreenType[]} */
  history = [];
  /**
   * Navigate to a specified screen
   * @param {ScreenType} screen - The screen to navigate to
   */
  navigateTo(screen) {
    this.history.push(this.current_screen);
    this.current_screen = screen;
  }
  // Navigate back to the previous screen in history
  goBack() {
    if (this.history.length === 0) return;
    const previous_screen = this.history.pop();
    if (previous_screen) {
      this.current_screen = previous_screen;
    }
  }
}
const navigation = new NavigationState();
export {
  SCREENS as S,
  navigation as n
};
