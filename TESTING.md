# Testing Guide for Family Finance PWA

## Overview
This guide provides comprehensive testing instructions for the Family Finance PWA, covering both online and offline functionality.

## Prerequisites
Before testing, ensure you have:
1. ✅ Supabase project set up with database schema
2. ✅ Environment variables configured in `.env.local`
3. ✅ Application running on `http://localhost:5173`
4. ✅ Browser with developer tools available

## Testing Scenarios

### 1. Authentication Testing

#### Test Case 1.1: User Registration
1. Navigate to the app
2. Click "Daftar di sini" on login page
3. Fill registration form:
   - Full Name: "Test User"
   - Email: "test@example.com" 
   - Password: "testpassword123"
   - Confirm Password: "testpassword123"
4. Click "Daftar"
5. **Expected**: Redirect to family setup page

#### Test Case 1.2: User Login
1. Navigate to login page
2. Enter credentials:
   - Email: "test@example.com"
   - Password: "testpassword123"
3. Click "Masuk"
4. **Expected**: Redirect to dashboard or family setup

### 2. Family Management Testing

#### Test Case 2.1: Create New Family
1. After registration, on family setup page
2. Select "Buat Keluarga Baru" tab
3. Enter family name: "Test Family"
4. Click "Buat Keluarga"
5. **Expected**: 
   - Family created with unique code
   - Redirect to dashboard
   - Default accounts and categories created

#### Test Case 2.2: Join Existing Family
1. Create a second user account
2. On family setup page, select "Bergabung dengan Keluarga"
3. Enter family code from first user
4. Click "Bergabung"
5. **Expected**: Successfully join the family

### 3. Transaction Management Testing

#### Test Case 3.1: Create Income Transaction (Online)
1. Navigate to Transactions page
2. Click "Tambah Transaksi"
3. Fill form:
   - Type: "Pemasukan"
   - Amount: 5000000
   - Category: "Gaji"
   - Account: "Bank"
   - Date: Today
   - Description: "Gaji bulan ini"
4. Click "Simpan"
5. **Expected**: Transaction appears in list and dashboard updates

#### Test Case 3.2: Create Expense Transaction (Online)
1. Click "Tambah Transaksi"
2. Fill form:
   - Type: "Pengeluaran"
   - Amount: 150000
   - Category: "Makanan"
   - Account: "Kas"
   - Date: Today
   - Description: "Belanja bulanan"
3. Click "Simpan"
4. **Expected**: Transaction created and balance updated

### 4. Offline Functionality Testing

#### Test Case 4.1: Go Offline
1. Open browser developer tools (F12)
2. Go to Network tab
3. Check "Offline" checkbox
4. **Expected**: App shows offline indicator

#### Test Case 4.2: Create Transaction Offline
1. While offline, navigate to Transactions
2. Click "Tambah Transaksi"
3. Fill form with test data
4. Click "Simpan"
5. **Expected**: 
   - Transaction created locally
   - Shows pending sync indicator
   - Transaction marked as offline

#### Test Case 4.3: Sync When Online
1. Uncheck "Offline" in developer tools
2. Wait for automatic sync or trigger manual sync
3. **Expected**: 
   - Offline transactions sync to server
   - Local IDs replaced with server IDs
   - Sync indicator disappears

### 5. Account & Category Management Testing

#### Test Case 5.1: Create New Account
1. Navigate to "Akun & Kategori" page
2. Click "Tambah Akun"
3. Fill form:
   - Name: "Dompet"
   - Type: "Tunai"
   - Initial Balance: 500000
4. Click "Simpan"
5. **Expected**: Account created and appears in grid

#### Test Case 5.2: Create New Category
1. Click "Tambah Kategori"
2. Fill form:
   - Name: "Bensin"
   - Type: "Pengeluaran"
   - Icon: "🚗 Transportasi"
   - Color: Red
3. Click "Simpan"
4. **Expected**: Category created and available in transactions

### 6. Responsive Design Testing

#### Test Case 6.1: Desktop View
1. Use browser width > 768px
2. **Expected**: Sidebar navigation visible on left

#### Test Case 6.2: Mobile View
1. Use browser width < 768px
2. **Expected**: Bottom navigation bar visible

### 7. PWA Functionality Testing

#### Test Case 7.1: Install PWA
1. In Chrome, look for install prompt
2. Click "Install" 
3. **Expected**: App installs as standalone app

#### Test Case 7.2: Offline Cache
1. Load app while online
2. Go offline
3. Navigate between pages
4. **Expected**: Pages load from cache

### 8. Data Persistence Testing

#### Test Case 8.1: Refresh Page
1. Create some transactions
2. Refresh page (F5)
3. **Expected**: Data persists and loads correctly

#### Test Case 8.2: Close and Reopen Browser
1. Close browser completely
2. Reopen and navigate to app
3. **Expected**: User stays logged in, data loads

## Performance Testing

### Load Time Testing
1. Clear browser cache
2. Load app and measure:
   - Time to first byte
   - Time to interactive
   - Largest contentful paint
3. **Target**: < 3 seconds on 3G connection

### Bundle Size Testing
1. Build app: `npm run build`
2. Check bundle size in `dist` folder
3. **Target**: < 500KB gzipped main bundle

## Security Testing

### Authentication Security
1. Try accessing protected routes without login
2. **Expected**: Redirect to login page

### Data Isolation
1. Create two families
2. Verify one family cannot see other's data
3. **Expected**: Complete data isolation

## Browser Compatibility Testing

Test in the following browsers:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

## Mobile Device Testing

Test on:
- ✅ Android Chrome
- ✅ iOS Safari
- ✅ Various screen sizes

## Error Handling Testing

### Network Error Testing
1. Disconnect internet during API call
2. **Expected**: Graceful fallback to cached data

### Server Error Testing
1. Use invalid Supabase credentials
2. **Expected**: Proper error messages shown

## Reporting Issues

When reporting issues, include:
1. Steps to reproduce
2. Expected vs actual behavior
3. Browser and device information
4. Console errors (F12 → Console)
5. Network requests (F12 → Network)

## Test Checklist

### Basic Functionality
- [ ] User registration works
- [ ] User login works
- [ ] Family creation works
- [ ] Join family works
- [ ] Create transactions works
- [ ] View dashboard works
- [ ] Responsive design works

### Advanced Functionality
- [ ] Offline transaction creation
- [ ] Automatic sync when online
- [ ] Account management
- [ ] Category management
- [ ] PWA installation
- [ ] Data persistence

### Performance
- [ ] Fast loading times
- [ ] Smooth animations
- [ ] No memory leaks
- [ ] Efficient caching

### Security
- [ ] Authentication required
- [ ] Data isolation between families
- [ ] Secure API communication
- [ ] No sensitive data in console

## Conclusion

After completing all tests, the application should:
1. Work seamlessly online and offline
2. Provide fast, responsive user experience
3. Maintain data integrity and security
4. Function correctly across devices and browsers

For any issues found during testing, refer to the troubleshooting section in README.md or create detailed bug reports.