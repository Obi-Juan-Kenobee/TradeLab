# Changelog

All notable changes to the TradeLab project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Tabbed interface for different market types (stocks, futures, options, cryptocurrency)
- Market-specific form fields for each trading instrument
- Form validation for required fields
- Reset button functionality for clearing form inputs
- Improved UI with smooth tab transitions and animations
- Better form organization with proper input types and validation
- Futures contract expiration month selection modal
- Automatic futures symbol construction with proper format (e.g., MESH2025)
- Support for common futures symbols (ES, NQ, MES, MNQ, CL, GC, SI, ZB, ZN, 6E)

### Changed
- Restructured trade entry form to use tabs for different market types
- Updated form styling for better user experience
- Improved button layout with addition of reset functionality
- Enhanced cumulative PnL chart with dynamic coloring:
  - Red segments for losses and green segments for profits
  - Continuous line with smooth color transitions
  - Matching fill colors above and below zero line
- Updated analytics page styling with consistent colors for profit/loss indicators

### Fixed
- Duplicate ID issues in form fields
- Form validation handling for different market types
- Cumulative PnL and ROI display not updating with trade data
- Position MAE and Price MAE bars not displaying correctly in analytics
- Reference error in price performance chart calculation
