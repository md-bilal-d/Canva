export class StitchClient {
  constructor(appId) {
    this.appId = appId;
    this.currentUser = JSON.parse(localStorage.getItem('stitch_user') || 'null');
  }

  async login(email, password) {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentUser = { id: `user-${Date.now()}`, email };
        localStorage.setItem('stitch_user', JSON.stringify(this.currentUser));
        resolve(this.currentUser);
      }, 1000);
    });
  }

  async loginWithGoogle() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentUser = { id: `google-${Date.now()}`, email: 'google.user@example.com' };
        localStorage.setItem('stitch_user', JSON.stringify(this.currentUser));
        resolve(this.currentUser);
      }, 1000);
    });
  }

  async signUp(email, password) {
    return this.login(email, password);
  }

  async logout() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentUser = null;
        localStorage.removeItem('stitch_user');
        resolve();
      }, 500);
    });
  }
}

// Initialize Google Stitch with app ID
export const stitchClient = new StitchClient('your-app-id');
export default stitchClient;
