export interface Project {
  _id: string,
  projectName: string,
  projectTag: string,
  description: string,
  developer: string,
  index: string,
  isActive: true,
  createdDate: string,
  logo: string,
  blocked?: string,
  status: 'new' | 'active' | 'on hold' | 'finished'
}
  