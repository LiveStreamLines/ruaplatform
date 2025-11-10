import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { DeveloperService } from '../../services/developer.service';
import { ProjectService } from '../../services/project.service';
import { Developer } from '../../models/developer.model';
import { Project } from '../../models/project.model';
import { MatDialog } from '@angular/material/dialog';
import { ServiceVideoDialogComponent } from '../service-video-dialog/service-video-dialog.component';


@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatListModule, MatIconModule, MatGridListModule],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css'
})
export class ServicesComponent implements OnInit {
  developerTag!: string;
  developerName!: string;
  projectTag!: string;
  projectName!: string;
  filteredServices: any[] = [];
  accessibleServices: string[] = [];
  userRole: string | null = null;
  isMobile: boolean = false;

  allowedTags: string[] = ['prime', 'stg', 'gugg1', 'puredc', 'proj', 'abna']; // Add all allowed tags here
  allowedSite: string[] =['gugg1'];
  allowedDrone: string[] =['yasbay'];


  services = [
    { name: 'Time lapse', image: 'assets/Eq-1.png', videourl:'', route: '/timelapse' },
    { name: 'Live Streaming', image: 'assets/Eq-6.png', videourl:'assets/videos/live.mp4', route: '/liveview' },
    { name: 'Drone Shooting', image: 'assets/Eq-2.png', videourl:'assets/videos/drone.mp4', route: '/drone-shooting' },
    { name: 'Site Photography & Videography', image: 'assets/Eq-3.png', videourl:'assets/videos/site.mp4', route: '/site-photography' },
    { name: '360 Photography & Videography', image: 'assets/Eq-4.png', videourl:'assets/videos/360.mp4', route: '/360-photography' },
    { name: 'Satellite Imagery', image: 'assets/Eq-5.png', videourl:'assets/videos/sat.mp4', route: '/satellite-imagery' }
  ];

  constructor(
    private breadcrumbService: BreadcrumbService,
    private route: ActivatedRoute, 
    private router: Router, 
    private developerService: DeveloperService,
    private projectService: ProjectService,
    private dialog: MatDialog, // Inject MatDialog here
    private authService: AuthService) {
    // Retrieve the route parameters
    this.route.params.subscribe(params => {
      this.developerTag = params['developerTag'];
      this.projectTag = params['projectTag'];
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    this.updateFilteredServices();
  }

  private updateFilteredServices() {
    if (this.userRole === 'Super Admin' || this.accessibleServices[0] === 'all') {
      // Always show only Timelapse and Live Streaming
      this.filteredServices = this.services.filter(service => 
        service.name === 'Time lapse' || 
        (service.name === 'Live Streaming' && this.allowedTags.includes(this.projectTag))
      );
    } else {
      // For non-admin users, filter based on accessible services but only show Timelapse and Live Streaming
      this.filteredServices = this.services.filter((service) => {
        return (service.name === 'Time lapse' || 
               (service.name === 'Live Streaming' && this.allowedTags.includes(this.projectTag))) &&
               this.accessibleServices.includes(service.name);
      });
    }
  }

  ngOnInit(): void {
    this.checkScreenSize(); // Initial check for screen size
    this.developerService.getDeveloperIdByTag(this.developerTag).subscribe({
        next: (developer: Developer[]) => {
          this.developerName = developer[0].developerName;
          this.projectService.getProjectIdByTag(this.projectTag).subscribe({
            next: (projects: Project[])=>{
              this.projectName = projects[0].projectName;
              this.breadcrumbService.setBreadcrumbs([
                { label: 'Home ', url: '/home' },
                { label: `${this.developerName}`, url: `home/${this.developerTag}` },
                { label: `${this.projectName}`},
              ]);
            },
            error: (err: any) => {
              console.log(err);
            }
          });
        },
        error:(err: any) => {
          console.log(err);
        }
    });   

    // Get user role and accessible projects
    this.userRole = this.authService.getUserRole();
    this.accessibleServices = this.authService.getAccessibleServices();
    this.updateFilteredServices();
  }


  navigateTo(serviceRoute: string, video: string, title: string) {
    
    if (serviceRoute === '/timelapse') {
      this.router.navigate([`home/${this.developerTag}/${this.projectTag}/${serviceRoute}`]);
    } else if (this.allowedTags.includes(this.projectTag) && serviceRoute === '/liveview') {
      this.router.navigate([`home/${this.developerTag}/${this.projectTag}/camera-selection`]);  
    } else if (this.allowedSite.includes(this.projectTag) && serviceRoute === "/site-photography") {
      this.router.navigate([`home/${this.developerTag}/${this.projectTag}/${serviceRoute}`]);   
    } else if (this.allowedDrone.includes(this.projectTag) && serviceRoute === "/drone-shooting") {
      this.router.navigate([`home/${this.developerTag}/${this.projectTag}/${serviceRoute}`]);
    } else {
      const videoUrl = video;
      this.dialog.open(ServiceVideoDialogComponent, {
        data: { title: title, videoUrl },
        width: '80%',
        height: '80%',
      });
    }

  }

  goBack(): void {
    this.router.navigate([`/home/${this.developerTag}`]);  // Go back to the project list with developer ID  }
  }
}
