import chai from 'chai';
import { applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import Kudu from 'kudu-client';
import nock from 'nock';
import createKuduActionCreators from '../src/actions';

const expect = chai.expect;
const mockApp = new Kudu({
  baseURL: 'http://example.com',
});
const middlewares = [ thunk ];

// Create a Kudu model.
const MockModel = mockApp.createModel('test', {
  properties: {
    name: {
      type: String,
      required: true,
    },
  },
});
const actions = createKuduActionCreators(mockApp);

// Create a mock Redux store with middleware. Adapted from
// http://rackt.org/redux/docs/recipes/WritingTests.html#async-action-creators.
function mockStore( getState, expectedActions, done ) {

  if ( !Array.isArray(expectedActions) ) {
    throw new Error('Expected an array of expected actions.');
  }

  if ( typeof done !== 'function' && done !== undefined ) {
    throw new Error('Expected a callback function.');
  }

  function mockStoreWithoutMiddleware() {

    return {
      getState() {
        return typeof getState === 'function' ? getState() : getState;
      },
      dispatch( action ) {

        const expectedAction = expectedActions.shift();

        try {

          expect(action.type).to.equal(expectedAction.type);

          if ( done && !expectedActions.length ) {
            done();
          }
        } catch ( e ) {
          done(e);
        }
      },
    };
  }

  return applyMiddleware(...middlewares)(mockStoreWithoutMiddleware)();
}


describe('Actions', () => {

  describe('save', () => {

    it('should throw if not passed a Kudu model instance', () => {
      let store = mockStore({}, []);
      let test = () => store.dispatch(actions.save());
      expect(test).to.throw(Error, /Expected a model instance/);
    });

    it('creates SAVE_SUCCEEDED when the request completes successfully', ( done ) => {

      let data = new MockModel({ name: 'test' });
      let response = mockApp.serialize.toJSON(new MockModel({ name: 'test', id: '1' }));
      let expectedActions = [
        { type: 'SAVE_TEST' },
        { type: 'SAVE_TEST_SUCCEEDED' },
      ];
      let store = mockStore({}, expectedActions, done);

      nock('http://example.com').post('/tests').reply(201, response);
      store.dispatch(actions.save('test', data));
    });

    it('creates SAVE_FAILED when the request fails', ( done ) => {

      let data = new MockModel({ name: 'test' });
      let expectedActions = [
        { type: 'SAVE_TEST' },
        { type: 'SAVE_TEST_FAILED' },
      ];
      let store = mockStore({}, expectedActions, done);

      nock('http://example.com').post('/tests').reply(500);
      store.dispatch(actions.save('test', data));
    });
  });

  describe('getAll', () => {

    it('should throw if no corresponding Kudu model is found', () => {
      let store = mockStore({}, []);
      let test = () => store.dispatch(actions.getAll('fail'));
      expect(test).to.throw(Error, /No model/);
    });

    it('creates GET_ALL_SUCCEEDED when the request completes successfully', ( done ) => {

      let data = [
        { type: 'test', id: '1' },
        { type: 'test', id: '2' },
      ];
      let expectedActions = [
        { type: 'GET_ALL_TESTS' },
        { type: 'GET_ALL_TESTS_SUCCEEDED' },
      ];
      let store = mockStore({}, expectedActions, done);

      nock('http://example.com').get('/tests').reply(200, { data });
      store.dispatch(actions.getAll('test'));
    });

    it('creates GET_ALL_FAILED when the request fails', ( done ) => {

      let expectedActions = [
        { type: 'GET_ALL_TESTS' },
        { type: 'GET_ALL_TESTS_FAILED' },
      ];
      let store = mockStore({}, expectedActions, done);

      nock('http://example.com').get('/tests').reply(500);
      store.dispatch(actions.getAll('test'));
    });
  });
});
