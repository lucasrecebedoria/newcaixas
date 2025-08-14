const STORAGE = {
  saveReports: (r)=> localStorage.setItem('reports', JSON.stringify(r)),
  getReports: ()=> JSON.parse(localStorage.getItem('reports')||'[]'),
  saveSession: (s)=> localStorage.setItem('session', JSON.stringify(s)),
  getSession: ()=> JSON.parse(localStorage.getItem('session')||'null'),
  saveUsers: (u)=> localStorage.setItem('users', JSON.stringify(u)),
  getUsers: ()=> JSON.parse(localStorage.getItem('users')||'[]')
};