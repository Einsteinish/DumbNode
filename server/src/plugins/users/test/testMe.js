import assert from 'assert';
import testMngr from '~/test/testManager';

describe('Users', function() {
  let client;
  before(async () => {
      await testMngr.start();
  });
  after(async () => {
      await testMngr.stop();
  });

  describe('User Basic ', async () => {
    before(async () => {
      client = testMngr.client('alice');
      assert(client);
      await client.login();
    });
    it('should get me', async () => {
      let me = await client.get('v1/me');
      assert(me);
    });
    it('should patch user', async () => {
      let data = {
        username: "Ciccio"
      };
      await client.patch('v1/me', data);
      //assert(me);
      let dataOld = {
        username: "alice"
      };
      await client.patch('v1/me', dataOld);
    });
    it('malformed patch username too short', async () => {
      let data = {
        username: "Ci"
      };
      try {
        await client.patch('v1/me', data);
        assert(false);
      } catch(res){
        assert.equal(res.statusCode, 400);
      }
    });
  });
});
