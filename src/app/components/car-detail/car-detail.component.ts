import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Car } from 'src/app/models/car';
import { CarImage } from 'src/app/models/carImage';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { Rental } from 'src/app/models/rental';
import { CarImageService } from 'src/app/services/car-image.service';
import { CarService } from 'src/app/services/car.service';
import { RentalService } from 'src/app/services/rental.service';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-car-detail',
  templateUrl: './car-detail.component.html',
  styleUrls: ['./car-detail.component.css']
})
export class CarDetailComponent implements OnInit {

  car: Car;
  rentalForm: FormGroup;
  givenFullDate = false;
  rentalData = false;
  rentals: Rental[];
  dataLoaded = false;

  TotalPrice: number;

  baseImagePath = environment.baseUrl;
  path = "https://localhost:44314/api/carimages/";
  carImages: CarImage[] = [];


  constructor(
    private formBuilder: FormBuilder,
    private carService: CarService,
    private imageService: CarImageService,
    private activatedRoute: ActivatedRoute,
    private toastrService: ToastrService,
    private router: Router,
    private rentalService: RentalService
  ) { }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {

      if (params["carId"]) {
        this.getCarByCarId(params["carId"]);
        this.getCarImages(params["carId"]);
      }
      this.createRentalForm();

    })
  }

  createRentalForm() {
    this.rentalForm = this.formBuilder.group({
      carId: ['', Validators.required],
      rentalDate: ['', Validators.required],
      returnDate: ['', Validators.required]
    })

  }
  checkCarAvailability() {
    let rentDates = Object.assign({}, this.rentalForm.value);
    this.rentalForm.setValue({
      carId: this.car.carId,
      rentalDate: rentDates.rentalDate,
      returnDate: rentDates.returnDate
    })
    if (this.rentalForm.valid) {
      let rentalModal = Object.assign({}, this.rentalForm.value);
      console.log(rentalModal);
      this.differenceDates();
      this.checkAvailability();
    } else {
      this.toastrService.warning("Please enter the dates");
    }
  }


  differenceDates() {
    let dates = Object.assign({}, this.rentalForm.value);
    let rentalDate = dates.rentalDate;
    let returnDate = dates.returnDate;
    if (rentalDate > returnDate) {
      this.toastrService.warning("rent date return date dan buyuk olamaz");
      return 0;
    } else if (rentalDate == returnDate) {
      this.toastrService.warning("return and rental cannot be same day");
      return 0;
    } else {
      let rent = new Date(rentalDate);
      rent.setDate(rent.getDate());
      let retu = new Date(returnDate);
      retu.setDate(retu.getDate());
      let differenceInTime = retu.getTime() - rent.getTime();
      let differenceInDays = Math.floor((differenceInTime) / (1000 * 3600 * 24));
      this.toastrService.info("Checking the car availability...");
      this.toastrService.info("Total Price: " + this.car.dailyPrice * differenceInDays + " $")
      this.givenFullDate = true;
      return differenceInDays;
    }
  }


  getCarByCarId(carId: number) {
    this.carService.getCarByCarId(carId).subscribe((response) => {
      this.car = response.data[0];
      this.dataLoaded = true;
    })
  }


  getCarImages(carId: number) {
    this.imageService.getImagesByCar(carId).subscribe((response) => {
      this.carImages = response.data;
    });
  }


  getImagePath(carId: number) {
    let newPath = this.path + "getbycar?carId=" + carId;
    return newPath;
  }

  getRentals() {
    this.rentalService.getByCarId(this.car.carId).subscribe((response) => {
      this.rentals = response.data,
        this.rentalData = true;
    }, (responseError) => {
      this.toastrService.error("Couldn't get rentals from api!");
    })
  }

  checkAvailability() {
    this.getRentals();
    setTimeout(() => {
      if (this.rentalData) {

        this.rentals.forEach(element => {
          let dates = this.rentalForm.value;
          if (element.returnDate == null) {
            this.toastrService.warning("The car is not available yet ");
          }
          else if ((dates.rentalDate > element.rentDate && dates.returnDate > element.returnDate) || (dates.rentalDate < element.rentDate && dates.returnDate < element.returnDate)) {
            this.toastrService.success("Car is avaible  you will directed to payment page");
          }
          else {
            this.toastrService.warning("Car is not available please select other dates!")
          }
        });
      }
    },
      1000);

  }

}
