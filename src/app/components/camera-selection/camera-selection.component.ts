import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-camera-selection',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule],
  template: `
    <div class="header">
      <button (click)="goBack()" class="back-button">← Back</button>
      <h1 class="title">Live View Cameras</h1>
    </div>
    
    <div class="camera-grid">
      <mat-card class="camera-card" *ngFor="let camera of cameras" (click)="selectCamera(camera)">
        <div class="camera-image-container">
          <img [src]="camera.image" alt="{{ camera.name }}" class="camera-image">
          <div class="camera-overlay">
            <span class="view-text">View Camera</span>
          </div>
        </div>
        <mat-card-content>
          <h2 class="camera-name">{{ camera.name }}</h2>
          <p class="camera-description">{{ camera.description }}</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .header {
      display: flex;
      align-items: center;
      padding: 20px;
      background: linear-gradient(135deg, #9e8d60 0%, #beb395 100%);
      border-bottom: 1px solid #706444;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .title {
      margin: 0;
      margin-left: 20px;
      color: white;
      font-size: 24px;
      font-weight: 500;
    }

    .back-button {
      padding: 8px 16px;
      background: #706444;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
    }

    .back-button:hover {
      background: #5d5339;
    }
    
    .camera-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      padding: 30px;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .camera-card {
      cursor: pointer;
      transition: all 0.3s ease;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      background: #ffffff;
      border: 2px solid #dfd9ca;
      max-width: 400px;
      margin: 0 auto;
    }
    
    .camera-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(158, 141, 96, 0.3);
      border-color: #9e8d60;
    }

    .camera-image-container {
      position: relative;
      overflow: hidden;
      height: 200px;
    }
    
    .camera-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .camera-card:hover .camera-image {
      transform: scale(1.05);
    }

    .camera-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(158, 141, 96, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .camera-card:hover .camera-overlay {
      opacity: 1;
    }

    .view-text {
      color: white;
      font-size: 18px;
      font-weight: 500;
      padding: 8px 16px;
      border: 2px solid white;
      border-radius: 4px;
      background: rgba(54, 48, 33, 0.8);
    }

    .camera-name {
      margin: 16px 16px 8px;
      font-size: 20px;
      color: #363021;
      font-weight: 600;
    }

    .camera-description {
      margin: 0 16px 16px;
      color: #706444;
      font-size: 14px;
      line-height: 1.5;
    }

    @media (max-width: 1200px) {
      .camera-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .camera-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CameraSelectionComponent implements OnInit {
  developerTag!: string;
  projectTag!: string;
  
  cameras = [
    {
      id: 'camera1',
      projectTag: 'all',
      name: 'Live View Camera 1',
      description: 'Live view camera with full pan, tilt, and zoom control. Located at the main entrance.',
      image: 'assets/liveview.png'
    },

    {
      id: 'camera1',
      projectTag: 'abna',
      name: 'Live View Camera 1',
      description: 'Live view camera 1',
      image: 'assets/liveview.png'
    },
    {
      id: 'camera2',
      projectTag: 'abna',
      name: 'Live View Camera 2',
      description: 'Live view camera 2',
      image: 'assets/liveview.png'
    }
  
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.developerTag = params['developerTag'];
      this.projectTag = params['projectTag'];
    });

    if (this.projectTag === 'abna') {
      this.cameras = this.cameras.filter(camera => camera.projectTag === 'abna');
    } else if (this.projectTag !== 'abna') {
      this.cameras = this.cameras.filter(camera => camera.projectTag === 'all');
    }
  }

  selectCamera(camera: any) {
    this.router.navigate([`home/${this.developerTag}/${this.projectTag}/liveview/${camera.id}`]);
  }

  goBack() {
    this.router.navigate([`home/${this.developerTag}/${this.projectTag}`]);
  }
} 