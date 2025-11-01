# 🧪 Test Phase 1 - Visual Verification Guide

Follow these exact steps to verify Phase 1 is working correctly.

---

## ✅ Step-by-Step Verification

### 1. Open the App
Go to: **http://localhost:5173**

**Expected:** Page loads normally, no errors

---

### 2. Open Browser DevTools
- **Windows/Linux:** Press **F12**
- **Mac:** Press **Cmd + Option + I**

**Expected:** DevTools panel opens at bottom or side of browser

---

### 3. Click the "Application" Tab
(In Firefox, it's called "Storage" tab)

**Expected:** You see a left sidebar with various storage options

---

### 4. Find IndexedDB
In the left sidebar:
1. Look for **"IndexedDB"**
2. Click the arrow/triangle to expand it
3. You should see: **`algorithm-lens`**

**Expected:**
```
📦 IndexedDB
  └─ 🗄️ algorithm-lens
```

---

### 5. Expand the Database
Click the arrow next to **`algorithm-lens`**

**Expected:**
```
📦 IndexedDB
  └─ 🗄️ algorithm-lens
      └─ 📂 samples
```

---

### 6. Expand the Object Store
Click the arrow next to **`samples`**

**Expected:**
```
📦 IndexedDB
  └─ 🗄️ algorithm-lens
      └─ 📂 samples
          ├─ 🔑 id (keyPath)
          ├─ 📑 by-platform (index)
          └─ 📑 by-type (index)
```

---

### 7. Check the Console
Click the **"Console"** tab in DevTools

**Expected:**
- ✅ NO errors about database
- ✅ NO "Failed to initialize database" message

**If you see errors:** Check [PHASE_1_COMPLETE.md](./PHASE_1_COMPLETE.md) troubleshooting section

---

### 8. (Optional) Test Adding Data
In the Console, paste and run:

```javascript
(async () => {
  const { getDB } = await import('./lib/db');
  const db = await getDB();
  await db.put('samples', {
    id: 'test-phase1',
    platform: 'x',
    type: 'post',
    timestamp: Date.now(),
    author: 'phase1_tester',
    text: 'Phase 1 verification test'
  });
  console.log('✅ Test item added successfully!');
})();
```

**Expected:**
- Console shows: "✅ Test item added successfully!"
- Go back to Application tab → IndexedDB → algorithm-lens → samples
- You should see 1 item in the samples store

---

### 9. Test Data Persistence
1. Refresh the page (F5)
2. Open DevTools again (F12)
3. Go to Application → IndexedDB → algorithm-lens → samples
4. If you added test data in Step 8, it should still be there

**Expected:** Data persists across page reloads ✅

---

### 10. Check the Demo Page
1. In the app, click **"🎨 Demo"** in the navigation
2. Look at the "Local Database Status" card
3. It should show: **Items loaded: 0** (or 1 if you added test data)

**Expected:** Demo page loads, shows database status

---

## ✅ Phase 1 Complete Checklist

Mark each item as you verify it:

- [ ] App loads at http://localhost:5173
- [ ] DevTools opens without errors
- [ ] IndexedDB section visible in Application/Storage tab
- [ ] `algorithm-lens` database exists
- [ ] `samples` object store exists
- [ ] `by-platform` index exists
- [ ] `by-type` index exists
- [ ] Console shows no database errors
- [ ] (Optional) Test data can be added
- [ ] (Optional) Data persists after refresh
- [ ] Demo page shows database status

**If all boxes are checked:** ✅ **Phase 1 is complete!**

---

## 📸 What It Should Look Like

### Chrome DevTools:
```
Application
├─ IndexedDB
│  └─ algorithm-lens
│      └─ samples
│          ├─ id (keyPath)
│          ├─ by-platform
│          └─ by-type
```

### Firefox DevTools:
```
Storage
├─ Indexed DB
│  └─ algorithm-lens
│      └─ samples
│          ├─ Primary key: id
│          ├─ Index: by-platform
│          └─ Index: by-type
```

---

## 🐛 Common Issues

### Issue 1: "Cannot read property 'getDB' of undefined"
**Fix:** Make sure you saved `src/main.tsx` and the dev server reloaded

### Issue 2: IndexedDB section is empty
**Fix:**
1. Close DevTools
2. Refresh page
3. Reopen DevTools
4. Check again

### Issue 3: Database exists but has weird name
**Fix:** Make sure you're looking at `algorithm-lens`, not another database

### Issue 4: Cannot add test data
**Fix:** That's fine! The important part is that the database exists. Data will be added in Phase 2.

---

## ⏭️ What's Next?

Once you've verified all items in the checklist above:

1. ✅ Mark Phase 1 as complete
2. ➡️ Proceed to **Phase 2** in [NEXT_STEPS.md](./NEXT_STEPS.md)
3. 📝 Phase 2 will update the Samples page to actually load data into this database

---

**Estimated Time:** 5 minutes
**Status:** ✅ Phase 1 Foundation Complete
**Next:** Phase 2 - Samples Page Integration
