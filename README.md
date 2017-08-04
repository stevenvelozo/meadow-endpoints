# Meadow Endpoints

Automagic REST endpoints for basic CRUD operations on the Retold framework.

[![Code Climate](https://codeclimate.com/github/stevenvelozo/meadow-endpoints/badges/gpa.svg)](https://codeclimate.com/github/stevenvelozo/meadow-endpoints) [![Coverage Status](https://coveralls.io/repos/stevenvelozo/meadow-endpoints/badge.svg?branch=master)](https://coveralls.io/r/stevenvelozo/meadow-endpoints?branch=master) [![Build Status](https://travis-ci.org/stevenvelozo/meadow-endpoints.svg?branch=master)](https://travis-ci.org/stevenvelozo/meadow-endpoints) [![Dependency Status](https://david-dm.org/stevenvelozo/meadow-endpoints.svg)](https://david-dm.org/stevenvelozo/meadow-endpoints) [![devDependency Status](https://david-dm.org/stevenvelozo/meadow-endpoints/dev-status.svg)](https://david-dm.org/stevenvelozo/meadow-endpoints#info=devDependencies)

This library generates REST endpoints in a consistent manner.  Endpoints have the following features:

* Authentication
* Resource Authorization
* CRUD Operations
* Dynamic Filtering
* Schema Validation

The design philosophy is not to cover every possible use case, but to cover the 99% via configuration.  The last 1% is easily hand-craftable.

To best use this library, it should be in conjunction with [stricture](https://github.com/stevenvelozo/stricture) and [orator](https://github.com/stevenvelozo/orator).

Multiple organizations have been using these libraries in medium to high load production environments for over a year.