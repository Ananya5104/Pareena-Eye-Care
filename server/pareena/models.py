from django.db import models

from django.db import models

class Appointment(models.Model):
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    date = models.DateField()
    time = models.TimeField()
    issue = models.TextField(blank=True)

    def __str__(self):
        return f"Appointment: {self.name} on {self.date} at {self.time}"

class CallRequest(models.Model):
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    concern = models.TextField(blank=True)

    def __str__(self):
        return f"Call Request: {self.name} - {self.phone}"

# class Product(models)